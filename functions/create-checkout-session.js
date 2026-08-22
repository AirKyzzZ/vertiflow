const catalogue = require('../data/products.json');
const { resolveCart, validateCustomer, ValidationError } = require('./lib/catalogue');
const { checkoutMetadata, matchesTestAccess, testAccessDigest } = require('./lib/checkout-provenance');

function response(statusCode, body, headers = {}) {
  return { statusCode, headers, body: JSON.stringify(body) };
}

function stripeMode(key, prefixes) {
  const match = typeof key === 'string' && key.match(new RegExp(`^(?:${prefixes})_(test|live)_`));
  return match?.[1] ?? null;
}

function headerValue(headers, name) {
  const entry = Object.entries(headers ?? {}).find(([key]) => key.toLowerCase() === name);
  return entry?.[1];
}

function validateEnvironment(environment) {
  const secretMode = stripeMode(environment?.STRIPE_SECRET_KEY, 'sk|rk');
  const publishableMode = stripeMode(environment?.STRIPE_PUBLISHABLE_KEY, 'pk');
  if (!secretMode || !publishableMode || secretMode !== publishableMode) {
    throw new Error('Stripe key modes must match');
  }
  if (secretMode !== 'test') throw new Error('Live Stripe keys require a live catalogue');
  if (typeof environment.STRIPE_SHIPPING_RATE_ID !== 'string' || !environment.STRIPE_SHIPPING_RATE_ID.trim()) {
    throw new Error('Stripe shipping rate is required');
  }
  const testAccessSha256 = testAccessDigest(environment.VERTIFLOW_TEST_ACCESS_TOKEN);
  let siteUrl;
  try {
    siteUrl = new URL(environment.SITE_URL || environment.DEPLOY_PRIME_URL || environment.URL);
  } catch {
    throw new Error('Site URL is invalid');
  }
  if (!['http:', 'https:'].includes(siteUrl.protocol)) throw new Error('Site URL is invalid');
  return { siteUrl: siteUrl.toString().replace(/\/$/, ''), stripeMode: secretMode, testAccessSha256 };
}

function createCheckoutHandler({ stripe, catalogue: runtimeCatalogue, environment }) {
  return async (event) => {
    if (event.httpMethod !== 'POST') {
      return response(405, { error: 'Method not allowed' }, { Allow: 'POST' });
    }

    let payload;
    try {
      payload = JSON.parse(event.body);
    } catch {
      return response(400, { error: 'Invalid checkout request' });
    }

    try {
      const { siteUrl, stripeMode: mode, testAccessSha256 } = validateEnvironment(environment);
      if (!matchesTestAccess(headerValue(event.headers, 'x-vertiflow-test-access'), testAccessSha256)) {
        return response(403, { error: 'Test checkout access denied' });
      }
      const resolvedItems = resolveCart(runtimeCatalogue, payload.items);
      const customer = validateCustomer(payload.customer);
      const promoCode = typeof payload.promoCode === 'string' ? payload.promoCode.trim() : '';
      const params = {
        ui_mode: 'elements',
        mode: 'payment',
        line_items: resolvedItems.map(({ priceId, quantity }) => ({ price: priceId, quantity })),
        customer_email: customer.email,
        return_url: `${siteUrl}/commande/succes?session_id={CHECKOUT_SESSION_ID}`,
        shipping_options: [{ shipping_rate: environment.STRIPE_SHIPPING_RATE_ID }],
        payment_intent_data: {
          shipping: {
            name: `${customer.firstName} ${customer.lastName}`,
            phone: customer.phone || undefined,
            address: customer.address,
          },
        },
        metadata: {
          first_name: customer.firstName,
          last_name: customer.lastName,
          phone: customer.phone || '',
          fulfillment_status: 'awaiting_payment',
          ...checkoutMetadata(resolvedItems, mode),
          vf_test_access: '1',
        },
      };
      if (promoCode) {
        if (promoCode !== environment.VERTIFLOW_PROMO_CODE) throw new ValidationError('Invalid promo code');
        if (typeof environment.STRIPE_PROMOTION_CODE_ID !== 'string' || !environment.STRIPE_PROMOTION_CODE_ID.trim()) {
          throw new Error('Stripe promotion code is required');
        }
        params.discounts = [{ promotion_code: environment.STRIPE_PROMOTION_CODE_ID }];
      }
      const session = await stripe.checkout.sessions.create(params);
      if (!session?.id || !session?.client_secret) throw new Error('Stripe returned an incomplete Checkout Session');
      return response(200, {
        clientSecret: session.client_secret,
        sessionId: session.id,
        publishableKey: environment.STRIPE_PUBLISHABLE_KEY,
      });
    } catch (error) {
      if (error instanceof ValidationError) return response(400, { error: 'Invalid checkout request' });
      console.error('Checkout Session creation failed:', error);
      return response(500, { error: 'Checkout configuration error' });
    }
  };
}

exports.createCheckoutHandler = createCheckoutHandler;
exports.handler = async (event) => {
  try {
    validateEnvironment(process.env);
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    return createCheckoutHandler({ stripe, catalogue, environment: process.env })(event);
  } catch (error) {
    console.error('Checkout Session configuration failed:', error);
    return response(500, { error: 'Checkout configuration error' });
  }
};
