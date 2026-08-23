const crypto = require('node:crypto');

const catalogue = require('../data/products.json');
const { reviewedUnitAmount } = require('./lib/catalogue');
const {
  CHECKOUT_VERSION,
  isVertiflowCheckoutSession,
  matchesCheckoutDigest,
} = require('./lib/checkout-provenance');
const { EmailJsClient } = require('./lib/emailjs');
const { PrintfulOrderError, PrintfulOrdersClient } = require('./lib/printful-orders');

const HANDLED_EVENT_TYPES = new Set([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
]);
const SESSION_ID_PATTERN = /^cs_(?:test|live)_[A-Za-z0-9]+$/;
const PAYMENT_INTENT_ID_PATTERN = /^pi_[A-Za-z0-9_]+$/;

class PermanentOrderError extends Error {
  constructor(code, details, mismatch) {
    super(details);
    this.name = 'PermanentOrderError';
    this.code = code;
    this.details = details;
    this.permanent = true;
    if (mismatch) {
      this.expectedItems = mismatch.expectedItems;
      this.actualItems = mismatch.actualItems;
    }
  }
}

function jsonResponse(statusCode, body) {
  return { statusCode, body: JSON.stringify(body) };
}

function derivePrintfulExternalId(sessionId) {
  if (typeof sessionId !== 'string' || !SESSION_ID_PATTERN.test(sessionId) || sessionId.length > 255) {
    throw new Error('Invalid Checkout Session ID');
  }
  const digest = crypto.createHash('sha256').update(sessionId, 'utf8').digest('base64url');
  return `vf_${digest.slice(0, 29)}`;
}

function headerValue(headers, expectedName) {
  if (!headers || typeof headers !== 'object') return undefined;
  const entry = Object.entries(headers).find(([name]) => name.toLowerCase() === expectedName.toLowerCase());
  return entry?.[1];
}

function rawRequestBody(event) {
  if (typeof event?.body !== 'string') throw new Error('Invalid webhook body');
  if (!event.isBase64Encoded) return event.body;
  return Buffer.from(event.body, 'base64').toString('utf8');
}

function buildCatalogueIndex(runtimeCatalogue) {
  const variants = new Map();
  const duplicates = new Set();
  if (
    !Array.isArray(runtimeCatalogue?.products)
    || typeof runtimeCatalogue.currency !== 'string'
    || !/^[A-Z]{3}$/.test(runtimeCatalogue.currency)
  ) return variants;
  for (const product of runtimeCatalogue.products) {
    if (!product || typeof product !== 'object' || Array.isArray(product) || !Array.isArray(product.variants)) {
      continue;
    }
    let unitAmount;
    try {
      unitAmount = reviewedUnitAmount(product.price);
    } catch {
      continue;
    }
    for (const variant of product.variants) {
      if (
        !variant
        || typeof variant !== 'object'
        || Array.isArray(variant)
        || typeof product.slug !== 'string'
        || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug)
        || typeof product.name !== 'string'
        || !product.name.trim()
        || product.name.length > 200
        || typeof product.stripe_product_id !== 'string'
        || !/^prod_[A-Za-z0-9_]+$/.test(product.stripe_product_id)
        || typeof variant.stripe_price_id !== 'string'
        || !/^price_[A-Za-z0-9_]+$/.test(variant.stripe_price_id)
        || typeof variant.color !== 'string'
        || !variant.color.trim()
        || variant.color.length > 100
        || typeof variant.size !== 'string'
        || !variant.size.trim()
        || variant.size.length > 100
        || !Number.isSafeInteger(variant.printful_sync_product_id)
        || variant.printful_sync_product_id <= 0
        || !Number.isSafeInteger(variant.printful_catalog_variant_id)
        || variant.printful_catalog_variant_id <= 0
      ) continue;
      const syncVariantId = variant.printful_sync_variant_id;
      if (!Number.isSafeInteger(syncVariantId) || syncVariantId <= 0 || duplicates.has(syncVariantId)) continue;
      if (variants.has(syncVariantId)) {
        variants.delete(syncVariantId);
        duplicates.add(syncVariantId);
        continue;
      }
      variants.set(syncVariantId, {
        product,
        variant,
        currency: runtimeCatalogue.currency.toLowerCase(),
        unitAmount,
      });
    }
  }
  return variants;
}

async function listAllLineItems(stripe, sessionId) {
  const items = [];
  let startingAfter;
  while (true) {
    const params = {
      limit: 100,
      expand: ['data.price', 'data.price.product'],
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    };
    const page = await stripe.checkout.sessions.listLineItems(sessionId, params);
    if (!page || !Array.isArray(page.data)) throw new Error('Stripe returned invalid line items');
    items.push(...page.data);
    if (items.length > 100) {
      throw new PermanentOrderError('catalogue_mismatch', 'The paid Session contains more than 100 cart lines.');
    }
    if (!page.has_more) break;
    const lastId = page.data.at(-1)?.id;
    if (typeof lastId !== 'string' || !lastId || lastId === startingAfter) {
      throw new Error('Stripe returned invalid line-item pagination');
    }
    startingAfter = lastId;
  }
  if (items.length === 0) {
    throw new PermanentOrderError('catalogue_mismatch', 'The paid Session contains no cart lines.');
  }
  return items;
}

function positiveMetadataId(value) {
  if (typeof value !== 'string' || value.length > 20 || !/^[1-9][0-9]*$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function provenanceFailure(lineNumber) {
  const suffix = lineNumber ? ` Paid line ${lineNumber} is invalid.` : '';
  return new PermanentOrderError(
    'catalogue_mismatch',
    `Paid Checkout provenance does not match the server-reviewed cart.${suffix}`,
  );
}

function livemodeMatches(object, expected) {
  return typeof object?.livemode === 'boolean' && object.livemode === expected;
}

function displayLine(facts, product, currentEntry) {
  const boundedCurrentDisplay = Boolean(typeof currentEntry?.product.name === 'string'
    && currentEntry.product.name.trim()
    && currentEntry.product.name.length <= 200
    && typeof currentEntry.variant.color === 'string'
    && currentEntry.variant.color.trim()
    && currentEntry.variant.color.length <= 100
    && typeof currentEntry.variant.size === 'string'
    && currentEntry.variant.size.trim()
    && currentEntry.variant.size.length <= 100);
  const exactCurrentFacts = currentEntry
    && boundedCurrentDisplay
    && currentEntry.product.slug === facts.slug
    && currentEntry.product.stripe_product_id === facts.stripeProductId
    && currentEntry.currency === facts.currency
    && currentEntry.unitAmount === facts.unitAmount
    && currentEntry.variant.stripe_price_id === facts.priceId
    && currentEntry.variant.printful_sync_product_id === facts.syncProductId
    && currentEntry.variant.printful_sync_variant_id === facts.syncVariantId
    && currentEntry.variant.printful_catalog_variant_id === facts.catalogVariantId;
  if (exactCurrentFacts) {
    return {
      name: currentEntry.product.name.trim(),
      color: currentEntry.variant.color.trim(),
      size: currentEntry.variant.size.trim(),
      quantity: facts.quantity,
      syncVariantId: facts.syncVariantId,
    };
  }
  const historicalName = typeof product.name === 'string' ? product.name.trim() : '';
  return {
    name: historicalName && historicalName.length <= 200 ? historicalName : facts.slug.slice(0, 200),
    color: `Printful product ${facts.syncProductId}`,
    size: `Printful variant ${facts.catalogVariantId}`,
    quantity: facts.quantity,
    syncVariantId: facts.syncVariantId,
  };
}

function mapCanonicalLines(lineItems, variantIndex, session) {
  const metadata = session.metadata;
  if (
    !metadata
    || metadata.vf_checkout_version !== CHECKOUT_VERSION
    || !/^[1-9][0-9]{0,2}$/.test(metadata.vf_line_count || '')
    || Number(metadata.vf_line_count) !== lineItems.length
    || !['test', 'live'].includes(metadata.vf_livemode)
  ) throw provenanceFailure();
  const expectedLivemode = metadata.vf_livemode === 'live';
  if (!livemodeMatches(session, expectedLivemode)) throw provenanceFailure();

  const canonicalLines = lineItems.map((lineItem, index) => {
    const quantity = lineItem?.quantity;
    const price = lineItem?.price;
    const product = price?.product;
    const metadata = price?.metadata;
    const syncProductId = positiveMetadataId(metadata?.printful_sync_product_id);
    const syncVariantId = Number(metadata?.printful_sync_variant_id);
    const catalogVariantId = positiveMetadataId(metadata?.printful_catalog_variant_id);
    const validQuantity = Number.isInteger(quantity) && quantity >= 1 && quantity <= 10;
    const validPrice = price && typeof price === 'object' && !Array.isArray(price);
    const validProduct = product && typeof product === 'object' && !Array.isArray(product);
    const validPriceFacts = typeof price?.id === 'string'
      && /^price_[A-Za-z0-9_]+$/.test(price.id)
      && price.type === 'one_time'
      && price.recurring == null
      && typeof price.currency === 'string'
      && /^[a-z]{3}$/.test(price.currency)
      && Number.isSafeInteger(price.unit_amount)
      && price.unit_amount > 0;
    const slug = metadata?.commercial_slug;
    const metadataMatches = metadata?.integration === 'vertiflow'
      && typeof slug === 'string'
      && slug.length <= 500
      && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
      && syncProductId
      && positiveMetadataId(metadata?.printful_sync_variant_id)
      && catalogVariantId;
    const productMatches = validProduct
      && typeof product.id === 'string'
      && /^prod_[A-Za-z0-9_]+$/.test(product.id)
      && product.metadata?.integration === 'vertiflow'
      && product.metadata?.commercial_slug === slug;
    const modeMatches = validPrice
      && validProduct
      && livemodeMatches(price, expectedLivemode)
      && livemodeMatches(product, expectedLivemode);
    if (!validQuantity || !validPrice || !validPriceFacts || !metadataMatches || !productMatches || !modeMatches) {
      throw provenanceFailure(index + 1);
    }
    return {
      facts: {
        priceId: price.id,
        stripeProductId: product.id,
        currency: price.currency,
        unitAmount: price.unit_amount,
        slug,
        syncProductId,
        syncVariantId,
        catalogVariantId,
        quantity,
      },
      product,
    };
  });
  const facts = canonicalLines.map((line) => line.facts);
  if (!matchesCheckoutDigest(facts, metadata.vf_checkout_sha256)) throw provenanceFailure();

  return canonicalLines.map(({ facts, product }) => {
    const entry = variantIndex.get(facts.syncVariantId);
    return {
      ...displayLine(facts, product, entry),
    };
  });
}

function requiredText(value, maxLength, code, details) {
  if (typeof value !== 'string') throw new PermanentOrderError(code, details);
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) throw new PermanentOrderError(code, details);
  return normalized;
}

function optionalText(value, maxLength, code, details) {
  if (value == null || value === '') return '';
  return requiredText(value, maxLength, code, details);
}

function customerFacts(session) {
  const code = 'invalid_shipping_address';
  const details = 'The paid Session is missing bounded customer name or email data.';
  const email = requiredText(session.customer_details?.email ?? session.customer_email, 320, code, details).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new PermanentOrderError(code, details);
  return {
    firstName: requiredText(session.metadata?.first_name, 100, code, details),
    lastName: requiredText(session.metadata?.last_name, 100, code, details),
    customerEmail: email,
  };
}

function paymentIntentId(session) {
  const id = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id;
  if (typeof id !== 'string' || !PAYMENT_INTENT_ID_PATTERN.test(id)) {
    throw new Error('Stripe returned an invalid PaymentIntent reference');
  }
  return id;
}

function buildRecipient(paymentIntent, customerEmail) {
  const code = 'invalid_shipping_address';
  const shipping = paymentIntent?.shipping;
  const address = shipping?.address;
  const details = 'The paid PaymentIntent has an unsupported or incomplete shipping address.';
  if (!shipping || !address || typeof address !== 'object') throw new PermanentOrderError(code, details);
  const countryCode = requiredText(address.country, 2, code, details).toUpperCase();
  if (!/^[A-Z]{2}$/.test(countryCode) || countryCode === 'BR') {
    throw new PermanentOrderError(code, `${details} Country ${countryCode || 'unknown'} requires manual handling.`);
  }
  const stateCode = optionalText(address.state, 100, code, details);
  if (['US', 'CA', 'AU'].includes(countryCode) && !stateCode) {
    throw new PermanentOrderError(code, `${details} Country ${countryCode} requires a state code.`);
  }
  const recipient = {
    name: requiredText(shipping.name, 200, code, details),
    address1: requiredText(address.line1, 200, code, details),
    address2: optionalText(address.line2, 200, code, details),
    city: requiredText(address.city, 200, code, details),
    zip: requiredText(address.postal_code, 50, code, details),
    country_code: countryCode,
    email: customerEmail,
    phone: optionalText(shipping.phone, 50, code, details),
  };
  if (stateCode) recipient.state_code = stateCode;
  return recipient;
}

function sessionAmount(session) {
  if (!Number.isInteger(session.amount_total) || session.amount_total < 0) {
    throw new Error('Stripe returned an invalid paid amount');
  }
  if (typeof session.currency !== 'string' || !/^[A-Za-z]{3}$/.test(session.currency)) {
    throw new Error('Stripe returned an invalid currency');
  }
  return { amountTotal: session.amount_total, currency: session.currency.toLowerCase() };
}

async function checkpoint(stripe, session, additions) {
  const metadata = { ...(session.metadata ?? {}), ...additions };
  const updated = await stripe.checkout.sessions.update(session.id, { metadata });
  return {
    ...session,
    ...(updated && typeof updated === 'object' ? updated : {}),
    metadata: { ...metadata, ...(updated?.metadata ?? {}) },
  };
}

function isPermanentPrintfulFailure(error) {
  return error?.permanent === true
    || (error instanceof PrintfulOrderError && error.retryable === false);
}

function normalizeMismatchItems(items, allowEmpty) {
  if (!Array.isArray(items) || items.length > 100 || (!allowEmpty && items.length === 0)) return null;
  const normalized = [];
  for (const item of items) {
    if (
      !item
      || typeof item !== 'object'
      || Array.isArray(item)
      || !Number.isInteger(item.sync_variant_id)
      || item.sync_variant_id <= 0
      || !Number.isInteger(item.quantity)
      || item.quantity < 1
      || item.quantity > 10
    ) return null;
    normalized.push({ sync_variant_id: item.sync_variant_id, quantity: item.quantity });
  }
  return normalized;
}

function safePrintfulMismatch(error) {
  if (!(error instanceof PrintfulOrderError) || error.code !== 'draft_mismatch') return null;
  const expectedItems = normalizeMismatchItems(error.details?.expectedItems, false);
  const actualItems = normalizeMismatchItems(error.details?.actualItems, true);
  if (!expectedItems || !actualItems) return null;
  return { expectedItems, actualItems };
}

function failureOrder(context, failure) {
  return {
    firstName: context.customer?.firstName ?? 'Client',
    lastName: context.customer?.lastName ?? 'VertiFlow',
    customerEmail: context.customer?.customerEmail ?? 'vertiflow.pro@gmail.com',
    stripeSessionId: context.session.id,
    paymentIntentId: context.paymentIntentId,
    amountTotal: context.amount.amountTotal,
    currency: context.amount.currency,
    printfulOrderId: context.printfulOrderId,
    printfulExternalId: context.externalId,
    recipient: context.recipient,
    lines: context.lines,
    failure,
  };
}

async function reportPermanentFailure({ stripe, email, context, error }) {
  const failure = {
    code: error.code,
    details: error.details,
    ...(error.expectedItems && error.actualItems
      ? { expectedItems: error.expectedItems, actualItems: error.actualItems }
      : {}),
  };
  context.session = await checkpoint(stripe, context.session, {
    printful_external_id: context.externalId,
    fulfillment_status: 'permanent_failure',
    fulfillment_failure_code: failure.code,
  });
  await email.sendOwnerReview(failureOrder(context, failure));
  context.session = await checkpoint(stripe, context.session, {
    fulfillment_failure_reported: 'true',
  });
}

function createWebhookHandler({
  stripe,
  printful,
  email,
  webhookSecret,
  catalogue: runtimeCatalogue = catalogue,
  logger = console,
}) {
  if (!stripe?.webhooks?.constructEvent || !stripe?.checkout?.sessions || !stripe?.paymentIntents?.retrieve) {
    throw new Error('A Stripe client is required');
  }
  if (!printful?.createOrGetDraft) throw new Error('A Printful client is required');
  if (!email?.sendCustomerConfirmation || !email?.sendOwnerReview) throw new Error('An email client is required');
  if (typeof webhookSecret !== 'string' || !webhookSecret.trim()) throw new Error('STRIPE_WEBHOOK_SECRET is required');
  const variantIndex = buildCatalogueIndex(runtimeCatalogue);
  const logError = typeof logger?.error === 'function'
    ? logger.error.bind(logger)
    : console.error.bind(console);
  const logDebug = typeof logger?.debug === 'function'
    ? logger.debug.bind(logger)
    : console.debug.bind(console);

  return async (event) => {
    let stripeEvent;
    try {
      const signature = headerValue(event?.headers, 'stripe-signature');
      if (typeof signature !== 'string' || !signature) throw new Error('Missing signature');
      stripeEvent = await stripe.webhooks.constructEvent(rawRequestBody(event), signature, webhookSecret);
    } catch {
      return jsonResponse(400, { error: 'Invalid webhook request' });
    }

    if (!HANDLED_EVENT_TYPES.has(stripeEvent?.type)) {
      return jsonResponse(200, { received: true });
    }
    const eventSessionId = stripeEvent?.data?.object?.id;
    if (typeof eventSessionId !== 'string' || !SESSION_ID_PATTERN.test(eventSessionId)) {
      return jsonResponse(400, { error: 'Invalid webhook request' });
    }

    const context = {
      session: null,
      externalId: derivePrintfulExternalId(eventSessionId),
      paymentIntentId: null,
      amount: null,
      customer: null,
      recipient: null,
      lines: [],
      printfulOrderId: null,
    };

    try {
      context.session = await stripe.checkout.sessions.retrieve(eventSessionId);
      if (!context.session || context.session.id !== eventSessionId) {
        throw new Error('Stripe returned an invalid Checkout Session');
      }
      if (context.session.payment_status !== 'paid') {
        return jsonResponse(200, { received: true });
      }
      if (!isVertiflowCheckoutSession(context.session.metadata)) {
        logDebug('Ignoring a paid Checkout Session with no VertiFlow checkout marker', {
          sessionId: context.session.id,
        });
        return jsonResponse(200, { received: true });
      }
      if (context.session.livemode !== false) {
        logError('Paid session reached fulfilment gate in live mode while mode guards are test-only', {
          sessionId: context.session.id,
        });
        return jsonResponse(500, { error: 'Live checkout is not yet enabled' });
      }
      if (context.session.metadata?.vf_test_access !== '1') {
        return jsonResponse(200, { received: true });
      }
      if (
        context.session.metadata?.fulfillment_status === 'permanent_failure'
        && context.session.metadata?.fulfillment_failure_reported === 'true'
      ) {
        return jsonResponse(200, { received: true });
      }

      context.paymentIntentId = paymentIntentId(context.session);
      context.amount = sessionAmount(context.session);
      context.customer = customerFacts(context.session);
      const lineItems = await listAllLineItems(stripe, eventSessionId);
      context.lines = mapCanonicalLines(lineItems, variantIndex, context.session);
      const paymentIntent = await stripe.paymentIntents.retrieve(context.paymentIntentId);
      if (!paymentIntent || paymentIntent.id !== context.paymentIntentId) {
        throw new Error('Stripe returned an invalid PaymentIntent');
      }
      context.recipient = buildRecipient(paymentIntent, context.customer.customerEmail);

      const storedExternalId = context.session.metadata?.printful_external_id;
      if (storedExternalId && storedExternalId !== context.externalId) {
        throw new PermanentOrderError(
          'fulfillment_state_mismatch',
          'Stored Printful external ID does not match the paid Checkout Session.',
        );
      }
      const storedDraftId = context.session.metadata?.printful_draft_id;
      if (storedDraftId) {
        context.printfulOrderId = Number(storedDraftId);
        if (!Number.isInteger(context.printfulOrderId) || context.printfulOrderId <= 0) {
          throw new PermanentOrderError(
            'fulfillment_state_mismatch',
            'Stored Printful draft ID is invalid.',
          );
        }
        if (!storedExternalId) {
          context.session = await checkpoint(stripe, context.session, {
            printful_external_id: context.externalId,
          });
        }
      } else {
        let draft;
        try {
          draft = await printful.createOrGetDraft({
            externalId: context.externalId,
            recipient: context.recipient,
            items: context.lines.map(({ syncVariantId, quantity }) => ({
              sync_variant_id: syncVariantId,
              quantity,
            })),
          });
        } catch (error) {
          if (!isPermanentPrintfulFailure(error)) throw error;
          const mismatch = safePrintfulMismatch(error);
          if (mismatch) {
            throw new PermanentOrderError(
              'draft_mismatch',
              'Printful draft items do not match the paid order.',
              mismatch,
            );
          }
          const status = Number.isInteger(error.status) ? ` (HTTP ${error.status})` : '';
          throw new PermanentOrderError(
            'printful_rejected',
            `Printful rejected or mismatched the unconfirmed draft${status}. Manual review is required.`,
          );
        }
        if (draft?.status !== 'draft') {
          throw new PermanentOrderError(
            'printful_rejected',
            'Printful did not return an unconfirmed draft. Manual review is required.',
          );
        }
        context.printfulOrderId = Number(draft?.id);
        if (!Number.isInteger(context.printfulOrderId) || context.printfulOrderId <= 0) {
          throw new PermanentOrderError(
            'printful_rejected',
            'Printful returned an unconfirmed draft without a usable order ID. Manual review is required.',
          );
        }
        context.session = await checkpoint(stripe, context.session, {
          printful_external_id: context.externalId,
          printful_draft_id: String(context.printfulOrderId),
          fulfillment_status: 'awaiting_owner_confirmation',
        });
      }

      const order = {
        ...context.customer,
        stripeSessionId: context.session.id,
        paymentIntentId: context.paymentIntentId,
        ...context.amount,
        printfulOrderId: context.printfulOrderId,
        printfulExternalId: context.externalId,
        recipient: context.recipient,
        lines: context.lines,
      };
      if (context.session.metadata?.customer_email_sent !== 'true') {
        await email.sendCustomerConfirmation(order);
        context.session = await checkpoint(stripe, context.session, {
          customer_email_sent: 'true',
        });
      }
      if (context.session.metadata?.owner_email_sent !== 'true') {
        await email.sendOwnerReview(order);
        context.session = await checkpoint(stripe, context.session, {
          owner_email_sent: 'true',
          fulfillment_status: 'awaiting_owner_confirmation',
        });
      }
      return jsonResponse(200, { received: true });
    } catch (error) {
      if (error instanceof PermanentOrderError && context.session && context.amount && context.paymentIntentId) {
        try {
          await reportPermanentFailure({ stripe, email, context, error });
          return jsonResponse(200, { received: true });
        } catch (reportError) {
          logError('Permanent order failure reporting failed', {
            name: reportError?.name ?? 'Error',
            retryable: reportError?.retryable !== false,
          });
          return jsonResponse(500, { error: 'Order preparation failed' });
        }
      }
      logError('Paid-order webhook failed', {
        name: error?.name ?? 'Error',
        retryable: error?.retryable !== false,
      });
      return jsonResponse(500, { error: 'Order preparation failed' });
    }
  };
}

function requiredEnvironment(environment, names) {
  for (const name of names) {
    if (typeof environment?.[name] !== 'string' || !environment[name].trim()) {
      throw new Error(`${name} is required`);
    }
  }
}

function validateWebhookEnvironment(environment) {
  requiredEnvironment(environment, [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'PRINTFUL_STORE_ID',
    'EMAILJS_SERVICE_ID',
    'EMAILJS_PUBLIC_KEY',
    'EMAILJS_PRIVATE_KEY',
    'EMAILJS_CUSTOMER_TEMPLATE_ID',
    'EMAILJS_OWNER_TEMPLATE_ID',
  ]);
  if (!/^(?:sk|rk)_test_[A-Za-z0-9]+$/.test(environment.STRIPE_SECRET_KEY)) {
    throw new Error('A test Stripe secret is required');
  }
}

function createConfiguredHandler(environment) {
  validateWebhookEnvironment(environment);
  const printfulApiKey = environment.PRINTFUL_API_KEY || environment.PRINTFUL_TOKEN;
  if (typeof printfulApiKey !== 'string' || !printfulApiKey.trim()) {
    throw new Error('PRINTFUL_API_KEY is required');
  }
  const stripe = require('stripe')(environment.STRIPE_SECRET_KEY);
  const printful = new PrintfulOrdersClient({
    apiKey: printfulApiKey,
    storeId: Number(environment.PRINTFUL_STORE_ID),
  });
  const email = new EmailJsClient({
    serviceId: environment.EMAILJS_SERVICE_ID,
    publicKey: environment.EMAILJS_PUBLIC_KEY,
    privateKey: environment.EMAILJS_PRIVATE_KEY,
    customerTemplateId: environment.EMAILJS_CUSTOMER_TEMPLATE_ID,
    ownerTemplateId: environment.EMAILJS_OWNER_TEMPLATE_ID,
  });
  return createWebhookHandler({
    stripe,
    printful,
    email,
    webhookSecret: environment.STRIPE_WEBHOOK_SECRET,
  });
}

exports.createWebhookHandler = createWebhookHandler;
exports.derivePrintfulExternalId = derivePrintfulExternalId;
exports.validateWebhookEnvironment = validateWebhookEnvironment;
exports.handler = async (event) => {
  try {
    return await createConfiguredHandler(process.env)(event);
  } catch {
    console.error('Webhook configuration failed');
    return jsonResponse(500, { error: 'Webhook configuration error' });
  }
};
