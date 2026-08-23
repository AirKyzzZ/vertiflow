const assert = require('node:assert/strict');
const test = require('node:test');

const checkout = require('../functions/create-checkout-session');
const { createCheckoutHandler } = checkout;
const { checkoutDigest } = require('../functions/lib/checkout-provenance');
const legacyPaymentIntent = require('../functions/create-payment-intent');

const TEST_ACCESS_TOKEN = 'vertiflow-test-access-token-1234567890';

function catalogueFixture() {
  return {
    currency: 'EUR',
    products: [{
      slug: 'hoodie-vf-definition', name: 'Hoodie VF Definition', price: '64.99',
      stripe_product_id: 'prod_test_hoodie', active: true,
      variants: [{
        color: 'Noir', size: 'M', active: true,
        stripe_price_id: 'price_test_hoodie_black_m',
        printful_sync_product_id: 8001, printful_sync_variant_id: 9001,
        printful_catalog_variant_id: 10001,
      }],
    }],
  };
}

function environmentFixture(overrides = {}) {
  return {
    SITE_URL: 'https://vertiflow.fr',
    STRIPE_SECRET_KEY: 'sk_test_example',
    STRIPE_PUBLISHABLE_KEY: 'pk_test_example',
    STRIPE_SHIPPING_RATE_ID: 'shr_test_standard',
    VERTIFLOW_TEST_ACCESS_TOKEN: TEST_ACCESS_TOKEN,
    ...overrides,
  };
}

function eventFixture(overrides = {}) {
  return {
    httpMethod: 'POST',
    headers: { 'x-vertiflow-test-access': TEST_ACCESS_TOKEN },
    body: JSON.stringify({
      items: [{ slug: 'hoodie-vf-definition', color: 'Noir', size: 'M', quantity: 1, price: 0.01 }],
      customer: {
        firstName: 'Léa', lastName: 'Martin', email: 'lea@example.com', phone: '',
        address: { line1: '1 rue du Test', line2: '', city: 'Bordeaux', postal_code: '33000', country: 'FR', state: '' },
      },
      promoCode: '',
    }),
    ...overrides,
  };
}

test('handler creates Elements Checkout from canonical line items and native shipping', async () => {
  const calls = [];
  const stripe = { checkout: { sessions: { create: async (params) => {
    calls.push(params);
    return { id: 'cs_test_123', client_secret: 'cs_test_secret' };
  } } } };

  const response = await createCheckoutHandler({ stripe, catalogue: catalogueFixture(), environment: environmentFixture() })(eventFixture());

  assert.equal(response.statusCode, 200);
  const params = calls[0];
  assert.equal(params.ui_mode, 'elements');
  assert.deepEqual(params.line_items, [{ price: 'price_test_hoodie_black_m', quantity: 1 }]);
  const provenanceLines = [{
    priceId: 'price_test_hoodie_black_m', stripeProductId: 'prod_test_hoodie',
    currency: 'eur', unitAmount: 6499, slug: 'hoodie-vf-definition',
    syncProductId: 8001, syncVariantId: 9001, catalogVariantId: 10001, quantity: 1,
  }];
  assert.deepEqual(params.metadata, {
    first_name: 'Léa',
    last_name: 'Martin',
    phone: '',
    fulfillment_status: 'awaiting_payment',
    vf_checkout_version: '1',
    vf_checkout_sha256: checkoutDigest(provenanceLines),
    vf_line_count: '1',
    vf_livemode: 'test',
    vf_test_access: '1',
  });
  assert.equal(params.payment_intent_data.shipping.address.country, 'FR');
  assert.equal(params.shipping_options[0].shipping_rate, 'shr_test_standard');
  assert.equal('amount' in params, false);
  assert.deepEqual(JSON.parse(response.body), {
    clientSecret: 'cs_test_secret', sessionId: 'cs_test_123', publishableKey: 'pk_test_example',
  });
});

test('handler uses the Netlify deploy URL when SITE_URL is not configured', async () => {
  const calls = [];
  const stripe = { checkout: { sessions: { create: async (params) => {
    calls.push(params);
    return { id: 'cs_test_123', client_secret: 'cs_test_secret' };
  } } } };
  const environment = environmentFixture({
    SITE_URL: '',
    DEPLOY_PRIME_URL: 'https://deploy-preview-42--vertiflow.netlify.app/',
  });

  const response = await createCheckoutHandler({
    stripe,
    catalogue: catalogueFixture(),
    environment,
  })(eventFixture());

  assert.equal(response.statusCode, 200);
  assert.equal(
    calls[0].return_url,
    'https://deploy-preview-42--vertiflow.netlify.app/commande/succes?session_id={CHECKOUT_SESSION_ID}',
  );
});

test('handler prefers SITE_URL and falls back to Netlify URL last', async () => {
  const returnUrls = [];
  const stripe = { checkout: { sessions: { create: async (params) => {
    returnUrls.push(params.return_url);
    return { id: 'cs_test_123', client_secret: 'cs_test_secret' };
  } } } };
  const allUrls = environmentFixture({
    SITE_URL: 'https://vertiflow.fr/',
    DEPLOY_PRIME_URL: 'https://deploy-preview-42--vertiflow.netlify.app/',
    URL: 'https://vertiflow.netlify.app/',
  });
  const netlifyUrlOnly = environmentFixture({
    SITE_URL: '',
    DEPLOY_PRIME_URL: '',
    URL: 'https://vertiflow.netlify.app/',
  });

  assert.equal((await createCheckoutHandler({
    stripe, catalogue: catalogueFixture(), environment: allUrls,
  })(eventFixture())).statusCode, 200);
  assert.equal((await createCheckoutHandler({
    stripe, catalogue: catalogueFixture(), environment: netlifyUrlOnly,
  })(eventFixture())).statusCode, 200);
  assert.deepEqual(returnUrls, [
    'https://vertiflow.fr/commande/succes?session_id={CHECKOUT_SESSION_ID}',
    'https://vertiflow.netlify.app/commande/succes?session_id={CHECKOUT_SESSION_ID}',
  ]);
});

test('handler rejects missing or invalid test access before creating Checkout', async () => {
  let calls = 0;
  const stripe = { checkout: { sessions: { create: async () => { calls += 1; } } } };
  const handler = createCheckoutHandler({
    stripe, catalogue: catalogueFixture(), environment: environmentFixture(),
  });

  assert.equal((await handler(eventFixture({ headers: {} }))).statusCode, 403);
  assert.equal((await handler(eventFixture({
    headers: { 'X-Vertiflow-Test-Access': 'wrong-test-access-token-1234567890' },
  }))).statusCode, 403);
  assert.equal(calls, 0);
});

test('handler accepts only POST and reports malformed input without invoking Stripe', async () => {
  let calls = 0;
  const stripe = { checkout: { sessions: { create: async () => { calls += 1; } } } };
  const handler = createCheckoutHandler({ stripe, catalogue: catalogueFixture(), environment: environmentFixture() });

  assert.equal((await handler(eventFixture({ httpMethod: 'GET' }))).statusCode, 405);
  assert.equal((await handler(eventFixture({ body: '{' }))).statusCode, 400);
  assert.equal(calls, 0);
});

test('handler rejects Brazil before creating a Stripe Session', async () => {
  let calls = 0;
  const stripe = { checkout: { sessions: { create: async () => { calls += 1; } } } };
  const handler = createCheckoutHandler({ stripe, catalogue: catalogueFixture(), environment: environmentFixture() });
  const payload = JSON.parse(eventFixture().body);
  payload.customer.address.country = 'BR';

  const response = await handler(eventFixture({ body: JSON.stringify(payload) }));

  assert.equal(response.statusCode, 400);
  assert.deepEqual(JSON.parse(response.body), { error: 'Invalid checkout request' });
  assert.equal(calls, 0);
});

test('handler validates promo codes and rejects mixed Stripe key modes before charging', async () => {
  const calls = [];
  const stripe = { checkout: { sessions: { create: async (params) => { calls.push(params); return { id: 'cs', client_secret: 'secret' }; } } } };
  const promoHandler = createCheckoutHandler({
    stripe, catalogue: catalogueFixture(),
    environment: environmentFixture({ VERTIFLOW_PROMO_CODE: 'VERTI10', STRIPE_PROMOTION_CODE_ID: 'promo_123' }),
  });
  const validPromo = eventFixture({ body: JSON.stringify({ ...JSON.parse(eventFixture().body), promoCode: 'VERTI10' }) });
  assert.equal((await promoHandler(validPromo)).statusCode, 200);
  assert.deepEqual(calls[0].discounts, [{ promotion_code: 'promo_123' }]);
  assert.equal((await promoHandler(eventFixture({ body: JSON.stringify({ ...JSON.parse(eventFixture().body), promoCode: 'BAD' }) }))).statusCode, 400);

  const mixedModeHandler = createCheckoutHandler({
    stripe, catalogue: catalogueFixture(), environment: environmentFixture({ STRIPE_PUBLISHABLE_KEY: 'pk_live_example' }),
  });
  assert.equal((await mixedModeHandler(eventFixture())).statusCode, 500);
  assert.equal(calls.length, 1);
});

function liveCatalogueFixture() {
  const fixture = catalogueFixture();
  fixture.products[0].stripe_product_id = { test: 'prod_test_hoodie', live: 'prod_live_hoodie' };
  fixture.products[0].variants[0].stripe_price_id = {
    test: 'price_test_hoodie_black_m', live: 'price_live_hoodie_black_m',
  };
  return fixture;
}

test('handler accepts live Stripe keys with a live-priced catalogue and skips the test-access gate', async () => {
  const calls = [];
  const stripe = { checkout: { sessions: { create: async (params) => {
    calls.push(params);
    return { id: 'cs_live_123', client_secret: 'cs_live_secret' };
  } } } };
  const handler = createCheckoutHandler({
    stripe,
    catalogue: liveCatalogueFixture(),
    environment: environmentFixture({ STRIPE_SECRET_KEY: 'sk_live_example', STRIPE_PUBLISHABLE_KEY: 'pk_live_example' }),
  });

  const response = await handler(eventFixture({ headers: {} }));

  assert.equal(response.statusCode, 200);
  assert.deepEqual(calls[0].line_items, [{ price: 'price_live_hoodie_black_m', quantity: 1 }]);
  assert.equal(calls[0].metadata.vf_livemode, 'live');
  assert.deepEqual(JSON.parse(response.body), {
    clientSecret: 'cs_live_secret', sessionId: 'cs_live_123', publishableKey: 'pk_live_example',
  });
});

test('handler still rejects mismatched live/test Stripe key modes', async () => {
  let calls = 0;
  const stripe = { checkout: { sessions: { create: async () => { calls += 1; } } } };
  const handler = createCheckoutHandler({
    stripe,
    catalogue: liveCatalogueFixture(),
    environment: environmentFixture({ STRIPE_SECRET_KEY: 'sk_live_example', STRIPE_PUBLISHABLE_KEY: 'pk_test_example' }),
  });

  const response = await handler(eventFixture());
  assert.equal(response.statusCode, 500);
  assert.equal(calls, 0);
});

test('handler accepts a permissioned restricted test key', async () => {
  let calls = 0;
  const stripe = { checkout: { sessions: { create: async () => {
    calls += 1;
    return { id: 'cs_test_123', client_secret: 'cs_test_secret' };
  } } } };
  const handler = createCheckoutHandler({
    stripe,
    catalogue: catalogueFixture(),
    environment: environmentFixture({ STRIPE_SECRET_KEY: 'rk_test_checkout_writer' }),
  });

  assert.equal((await handler(eventFixture())).statusCode, 200);
  assert.equal(calls, 1);
});

test('exported Netlify handler returns a controlled configuration error for unusable Stripe secrets', async () => {
  const originalSecret = process.env.STRIPE_SECRET_KEY;
  const originalPublishable = process.env.STRIPE_PUBLISHABLE_KEY;
  const originalShippingRate = process.env.STRIPE_SHIPPING_RATE_ID;
  const originalSiteUrl = process.env.SITE_URL;
  try {
    process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_example';
    process.env.STRIPE_SHIPPING_RATE_ID = 'shr_test_standard';
    process.env.SITE_URL = 'https://vertiflow.fr';
    for (const secret of [undefined, '', 'not-a-stripe-secret']) {
      if (secret === undefined) delete process.env.STRIPE_SECRET_KEY;
      else process.env.STRIPE_SECRET_KEY = secret;
      const response = await checkout.handler(eventFixture());
      assert.equal(response.statusCode, 500);
      assert.deepEqual(JSON.parse(response.body), { error: 'Checkout configuration error' });
    }
  } finally {
    if (originalSecret === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = originalSecret;
    if (originalPublishable === undefined) delete process.env.STRIPE_PUBLISHABLE_KEY;
    else process.env.STRIPE_PUBLISHABLE_KEY = originalPublishable;
    if (originalShippingRate === undefined) delete process.env.STRIPE_SHIPPING_RATE_ID;
    else process.env.STRIPE_SHIPPING_RATE_ID = originalShippingRate;
    if (originalSiteUrl === undefined) delete process.env.SITE_URL;
    else process.env.SITE_URL = originalSiteUrl;
  }
});

test('legacy PaymentIntent endpoint is permanently retired', async () => {
  const response = await legacyPaymentIntent.handler(eventFixture());
  assert.equal(response.statusCode, 410);
  assert.deepEqual(JSON.parse(response.body), { error: 'Checkout endpoint replaced' });
});
