const assert = require('node:assert/strict');
const test = require('node:test');

const catalogue = require('../data/products.json');
const { checkoutMetadata } = require('../functions/lib/checkout-provenance');
const { PrintfulOrderError } = require('../functions/lib/printful-orders');
const {
  createWebhookHandler,
  derivePrintfulExternalId,
  handler: netlifyHandler,
  validateWebhookEnvironment,
} = require('../functions/stripe-webhook');

const TEST_ACCESS_TOKEN = 'vertiflow-test-access-token-1234567890';

const firstVariant = catalogue.products[0].variants[0];
const secondVariant = catalogue.products[0].variants[1];

function stripeLine(variant = firstVariant, overrides = {}) {
  const product = catalogue.products.find((candidate) => candidate.variants.includes(variant));
  return {
    id: `li_${variant.printful_sync_variant_id}`,
    quantity: 1,
    price: {
      id: variant.stripe_price_id,
      active: true,
      livemode: false,
      type: 'one_time',
      recurring: null,
      currency: catalogue.currency.toLowerCase(),
      unit_amount: Number(product.price) * 100,
      product: {
        id: product.stripe_product_id,
        name: product.name,
        active: true,
        livemode: false,
        metadata: {
          integration: 'vertiflow',
          commercial_slug: product.slug,
        },
      },
      metadata: {
        integration: 'vertiflow',
        commercial_slug: product.slug,
        printful_sync_product_id: String(variant.printful_sync_product_id),
        printful_sync_variant_id: String(variant.printful_sync_variant_id),
        printful_catalog_variant_id: String(variant.printful_catalog_variant_id),
      },
    },
    ...overrides,
  };
}

function provenanceLine(lineItem) {
  const { price } = lineItem;
  return {
    priceId: price.id,
    stripeProductId: price.product.id,
    currency: price.currency,
    unitAmount: price.unit_amount,
    slug: price.metadata.commercial_slug,
    syncProductId: Number(price.metadata.printful_sync_product_id),
    syncVariantId: Number(price.metadata.printful_sync_variant_id),
    catalogVariantId: Number(price.metadata.printful_catalog_variant_id),
    quantity: lineItem.quantity,
  };
}

function createHarness({
  eventType = 'checkout.session.completed',
  eventSessionId = 'cs_test_123',
  eventMetadata = {},
  sessionMetadata = {},
  paymentStatus = 'paid',
  pages = [{ data: [stripeLine()], has_more: false }],
  shipping,
  retrieveFailure,
  printfulFailure,
  printfulDraftId = 987,
  printfulDraftStatus = 'draft',
  customerEmailFailure,
  ownerEmailFailure,
  provenanceLines,
  runtimeCatalogue = catalogue,
  sessionOverrides = {},
  logger = { error: () => {} },
} = {}) {
  const calls = {
    rawBodies: [],
    signatures: [],
    sessionRetrievals: [],
    lineItemParams: [],
    paymentIntentRetrievals: [],
    drafts: [],
    customerEmails: [],
    ownerEmails: [],
    updates: [],
  };
  const currentSession = {
    id: eventSessionId,
    payment_status: paymentStatus,
    payment_intent: 'pi_test_123',
    customer_details: { email: 'lea@example.com' },
    amount_total: 3698,
    currency: 'eur',
    livemode: false,
    metadata: {
      first_name: 'Léa',
      last_name: 'Martin',
      phone: '',
      fulfillment_status: 'awaiting_payment',
      ...checkoutMetadata(
        provenanceLines ?? pages.flatMap((page) => page.data).map(provenanceLine),
        'test',
      ),
      vf_test_access: '1',
      ...sessionMetadata,
    },
    ...sessionOverrides,
  };
  for (const [name, value] of Object.entries(sessionOverrides)) {
    if (value === undefined) delete currentSession[name];
  }
  let customerFailuresRemaining = customerEmailFailure === 'once' ? 1 : Infinity;
  let ownerFailuresRemaining = ownerEmailFailure === 'once' ? 1 : Infinity;
  const stripe = {
    webhooks: {
      constructEvent: (body, signature, secret) => {
        calls.rawBodies.push(body);
        calls.signatures.push({ signature, secret });
        if (signature === 'invalid') throw new Error('signature details');
        return {
          type: eventType,
          data: { object: { id: eventSessionId, metadata: eventMetadata } },
        };
      },
    },
    checkout: {
      sessions: {
        retrieve: async (id) => {
          calls.sessionRetrievals.push(id);
          if (retrieveFailure) throw new Error('Stripe private retrieval failure');
          return structuredClone(currentSession);
        },
        listLineItems: async (_id, params) => {
          calls.lineItemParams.push(structuredClone(params));
          const pageIndex = params.starting_after ? 1 : 0;
          return structuredClone(pages[pageIndex]);
        },
        update: async (id, { metadata }) => {
          calls.updates.push({ id, metadata: structuredClone(metadata) });
          currentSession.metadata = structuredClone(metadata);
          return structuredClone(currentSession);
        },
      },
    },
    paymentIntents: {
      retrieve: async (id) => {
        calls.paymentIntentRetrievals.push(id);
        return {
          id,
          shipping: shipping ?? {
            name: 'Léa Martin',
            phone: '',
            address: {
              line1: '1 rue du Test',
              line2: '',
              city: 'Bordeaux',
              postal_code: '33000',
              country: 'FR',
              state: '',
            },
          },
        };
      },
    },
  };
  const printful = {
    createOrGetDraft: async (input) => {
      calls.drafts.push(structuredClone(input));
      if (printfulFailure) throw printfulFailure;
      return {
        id: printfulDraftId,
        external_id: input.externalId,
        status: printfulDraftStatus,
        recipient: input.recipient,
        items: input.items,
      };
    },
  };
  const email = {
    sendCustomerConfirmation: async (order) => {
      calls.customerEmails.push(structuredClone(order));
      if (customerEmailFailure && customerFailuresRemaining > 0) {
        customerFailuresRemaining -= 1;
        throw new Error('EmailJS private failure');
      }
    },
    sendOwnerReview: async (order) => {
      calls.ownerEmails.push(structuredClone(order));
      if (ownerEmailFailure && ownerFailuresRemaining > 0) {
        ownerFailuresRemaining -= 1;
        throw new Error('EmailJS private failure');
      }
    },
  };
  return {
    calls,
    currentSession,
    handler: createWebhookHandler({
      stripe, printful, email, webhookSecret: 'whsec_test', catalogue: runtimeCatalogue, logger,
    }),
  };
}

function webhookEvent(overrides = {}) {
  return {
    body: '{}',
    headers: { 'stripe-signature': 'sig' },
    ...overrides,
  };
}

test('paid webhook uses the raw decoded body and a case-insensitive signature header', async () => {
  const { handler, calls } = createHarness();
  const response = await handler(webhookEvent({
    body: Buffer.from('{"paid":true}').toString('base64'),
    isBase64Encoded: true,
    headers: { 'StRiPe-SiGnAtUrE': 'sig' },
  }));

  assert.equal(response.statusCode, 200);
  assert.deepEqual(calls.rawBodies, ['{"paid":true}']);
  assert.deepEqual(calls.signatures, [{ signature: 'sig', secret: 'whsec_test' }]);
});

test('signature failures are controlled and happen before any Stripe retrieval', async () => {
  const { handler, calls } = createHarness();
  const response = await handler(webhookEvent({ headers: { 'Stripe-Signature': 'invalid' } }));
  assert.equal(response.statusCode, 400);
  assert.deepEqual(calls.sessionRetrievals, []);
  assert.doesNotMatch(response.body, /signature details/);
});

test('an unauthorized test session is acknowledged without fulfillment side effects', async () => {
  const sessionOverrides = { metadata: { ...createHarness().currentSession.metadata, vf_test_access: undefined } };
  const { handler, calls } = createHarness({ sessionOverrides });
  const response = await handler(webhookEvent());
  assert.equal(response.statusCode, 200);
  assert.equal(calls.drafts.length, 0);
  assert.equal(calls.customerEmails.length, 0);
  assert.equal(calls.ownerEmails.length, 0);
});

test('a live session fails loudly instead of being silently swallowed', async () => {
  const errors = [];
  const { handler, calls } = createHarness({
    sessionOverrides: { livemode: true },
    logger: { error: (...arguments_) => errors.push(arguments_) },
  });
  const response = await handler(webhookEvent());
  assert.equal(response.statusCode, 500);
  assert.equal(calls.drafts.length, 0);
  assert.equal(calls.customerEmails.length, 0);
  assert.equal(calls.ownerEmails.length, 0);
  assert.equal(errors.length, 1);
  assert.equal(errors[0][0], 'Paid session reached fulfilment gate in live mode while mode guards are test-only');
});

test('authorized Session marker remains valid after checkout access-token rotation', async () => {
  const { handler, calls } = createHarness({
    sessionMetadata: { vf_test_access_sha256: 'obsolete-token-digest' },
  });

  assert.equal((await handler(webhookEvent())).statusCode, 200);
  assert.equal(calls.drafts.length, 1);
  assert.equal(calls.customerEmails.length, 1);
  assert.equal(calls.ownerEmails.length, 1);
});

test('unhandled and unpaid current sessions are acknowledged without fulfilment side effects', async (t) => {
  await t.test('unhandled event', async () => {
    const { handler, calls } = createHarness({ eventType: 'payment_intent.succeeded' });
    assert.equal((await handler(webhookEvent())).statusCode, 200);
    assert.equal(calls.sessionRetrievals.length, 0);
  });
  await t.test('unpaid current session', async () => {
    const { handler, calls } = createHarness({ paymentStatus: 'unpaid' });
    assert.equal((await handler(webhookEvent())).statusCode, 200);
    assert.equal(calls.sessionRetrievals.length, 1);
    assert.equal(calls.lineItemParams.length, 0);
    assert.equal(calls.drafts.length, 0);
    assert.equal(calls.customerEmails.length, 0);
    assert.equal(calls.ownerEmails.length, 0);
  });
});

test('fresh Checkout Session metadata, not immutable replay metadata, controls resumable steps', async () => {
  const { handler, calls, currentSession } = createHarness({
    eventMetadata: {
      printful_draft_id: 'old',
      customer_email_sent: 'true',
      owner_email_sent: 'true',
    },
  });

  assert.equal((await handler(webhookEvent())).statusCode, 200);
  assert.equal((await handler(webhookEvent())).statusCode, 200);
  assert.equal(calls.sessionRetrievals.length, 2);
  assert.equal(calls.drafts.length, 1);
  assert.equal(calls.customerEmails.length, 1);
  assert.equal(calls.ownerEmails.length, 1);
  assert.equal(currentSession.metadata.printful_draft_id, '987');
  assert.equal(currentSession.metadata.customer_email_sent, 'true');
  assert.equal(currentSession.metadata.owner_email_sent, 'true');
});

test('completed current metadata skips draft, customer, and owner steps', async () => {
  const externalId = derivePrintfulExternalId('cs_test_123');
  const { handler, calls } = createHarness({
    sessionMetadata: {
      printful_draft_id: '987',
      printful_external_id: externalId,
      customer_email_sent: 'true',
      owner_email_sent: 'true',
    },
  });

  assert.equal((await handler(webhookEvent())).statusCode, 200);
  assert.equal(calls.drafts.length, 0);
  assert.equal(calls.customerEmails.length, 0);
  assert.equal(calls.ownerEmails.length, 0);
});

test('line items are fully paginated, expanded, mapped to catalogue facts, and sent exactly to Printful', async () => {
  const pages = [
    { data: [stripeLine(firstVariant)], has_more: true },
    { data: [stripeLine(secondVariant, { quantity: 2 })], has_more: false },
  ];
  const { handler, calls } = createHarness({ pages });

  assert.equal((await handler(webhookEvent())).statusCode, 200);
  assert.deepEqual(calls.lineItemParams, [
    { limit: 100, expand: ['data.price', 'data.price.product'] },
    {
      limit: 100,
      expand: ['data.price', 'data.price.product'],
      starting_after: `li_${firstVariant.printful_sync_variant_id}`,
    },
  ]);
  assert.deepEqual(calls.drafts[0].items, [
    { sync_variant_id: firstVariant.printful_sync_variant_id, quantity: 1 },
    { sync_variant_id: secondVariant.printful_sync_variant_id, quantity: 2 },
  ]);
  assert.deepEqual(calls.customerEmails[0].lines, [
    {
      name: 'T-shirt CLIMB', color: 'Noir', size: 'S', quantity: 1,
      syncVariantId: firstVariant.printful_sync_variant_id,
    },
    {
      name: 'T-shirt CLIMB', color: 'Noir', size: 'M', quantity: 2,
      syncVariantId: secondVariant.printful_sync_variant_id,
    },
  ]);
});

test('invalid, unmanaged, mismatched, and duplicate Price mappings fail closed and alert only the owner', async (t) => {
  const scenarios = {
    'missing expanded Price': [stripeLine(firstVariant, { price: firstVariant.stripe_price_id })],
    'missing Price object': [stripeLine(firstVariant, { price: undefined })],
    'non-positive quantity': [stripeLine(firstVariant, { quantity: 0 })],
    'fractional quantity': [stripeLine(firstVariant, { quantity: 1.5 })],
    'wrong integration': [stripeLine(firstVariant, { price: { ...stripeLine().price, metadata: { ...stripeLine().price.metadata, integration: 'other' } } })],
    'wrong slug': [stripeLine(firstVariant, { price: { ...stripeLine().price, metadata: { ...stripeLine().price.metadata, commercial_slug: 'hoodie-vf-definition' } } })],
    'wrong Price id': [stripeLine(firstVariant, { price: { ...stripeLine().price, id: 'price_unmanaged' } })],
    'duplicate sync variant': [stripeLine(firstVariant), stripeLine(firstVariant, { id: 'li_duplicate' })],
  };

  for (const [name, data] of Object.entries(scenarios)) {
    await t.test(name, async () => {
      const { handler, calls, currentSession } = createHarness({
        pages: [{ data, has_more: false }],
        provenanceLines: [provenanceLine(stripeLine())],
      });
      assert.equal((await handler(webhookEvent())).statusCode, 200);
      assert.equal(calls.drafts.length, 0);
      assert.equal(calls.customerEmails.length, 0);
      assert.equal(calls.ownerEmails.length, 1);
      assert.equal(calls.ownerEmails[0].failure.code, 'catalogue_mismatch');
      assert.equal(currentSession.metadata.fulfillment_status, 'permanent_failure');
      assert.equal(currentSession.metadata.fulfillment_failure_reported, 'true');
    });
  }
});

test('an archived historical Price remains fulfillable after the current catalogue rotates', async () => {
  const historicalLine = stripeLine(firstVariant);
  historicalLine.price.active = false;
  const rotatedCatalogue = structuredClone(catalogue);
  rotatedCatalogue.products[0].price = '31.99';
  rotatedCatalogue.products[0].variants[0].stripe_price_id = 'price_rotated_current';
  const { handler, calls } = createHarness({
    pages: [{ data: [historicalLine], has_more: false }],
    provenanceLines: [provenanceLine(historicalLine)],
    runtimeCatalogue: rotatedCatalogue,
  });

  assert.equal((await handler(webhookEvent())).statusCode, 200);
  assert.deepEqual(calls.drafts[0].items, [{
    sync_variant_id: firstVariant.printful_sync_variant_id,
    quantity: 1,
  }]);
  assert.equal(calls.ownerEmails[0].failure, undefined);
});

test('a removed current mapping uses bounded historical display fallback and creates the exact draft', async () => {
  const historicalLine = stripeLine(firstVariant);
  const { handler, calls } = createHarness({
    pages: [{ data: [historicalLine], has_more: false }],
    provenanceLines: [provenanceLine(historicalLine)],
    runtimeCatalogue: { currency: 'EUR', products: [] },
  });

  assert.equal((await handler(webhookEvent())).statusCode, 200);
  assert.deepEqual(calls.drafts[0].items, [{
    sync_variant_id: firstVariant.printful_sync_variant_id,
    quantity: 1,
  }]);
  assert.deepEqual(calls.ownerEmails[0].lines, [{
    name: 'T-shirt CLIMB',
    color: `Printful product ${firstVariant.printful_sync_product_id}`,
    size: `Printful variant ${firstVariant.printful_catalog_variant_id}`,
    quantity: 1,
    syncVariantId: firstVariant.printful_sync_variant_id,
  }]);
});

test('invalid current display data cannot block verified historical fulfilment', async () => {
  const historicalLine = stripeLine(firstVariant);
  const runtimeCatalogue = structuredClone(catalogue);
  runtimeCatalogue.products[0].price = 'invalid-current-display-price';
  const { handler, calls } = createHarness({
    pages: [{ data: [historicalLine], has_more: false }],
    provenanceLines: [provenanceLine(historicalLine)],
    runtimeCatalogue,
  });

  assert.equal((await handler(webhookEvent())).statusCode, 200);
  assert.equal(calls.drafts.length, 1);
  assert.equal(calls.ownerEmails[0].lines[0].name, 'T-shirt CLIMB');
});

test('null and malformed current variants are skipped during historical display enrichment', async () => {
  const historicalLine = stripeLine(firstVariant);
  const runtimeCatalogue = {
    currency: 'EUR',
    products: [
      null,
      'not-a-product',
      {
        slug: 'malformed-current-product',
        name: 'Malformed current product',
        price: '29.99',
        stripe_product_id: 'prod_malformed',
        variants: [
          null,
          'not-a-variant',
          {
            printful_sync_variant_id: firstVariant.printful_sync_variant_id,
            color: null,
          },
        ],
      },
    ],
  };
  const { handler, calls } = createHarness({
    pages: [{ data: [historicalLine], has_more: false }],
    provenanceLines: [provenanceLine(historicalLine)],
    runtimeCatalogue,
  });

  assert.equal((await handler(webhookEvent())).statusCode, 200);
  assert.equal(calls.drafts.length, 1);
  assert.equal(calls.ownerEmails[0].lines[0].color, `Printful product ${firstVariant.printful_sync_product_id}`);
});

test('fresh provenance fails closed for Stripe fact, quantity, count, digest, and mode mutation', async (t) => {
  const baseline = stripeLine();
  const expected = [provenanceLine(baseline)];
  function changed(mutate) {
    const candidate = structuredClone(baseline);
    mutate(candidate);
    return candidate;
  }
  const scenarios = [
    ['arbitrary Price with copied metadata', changed((line) => { line.price.id = 'price_arbitrary'; }), {}, {}],
    ['Product id mismatch', changed((line) => { line.price.product.id = 'prod_other'; }), {}, {}],
    ['Product slug mismatch', changed((line) => { line.price.product.metadata.commercial_slug = 'other-product'; }), {}, {}],
    ['amount mutation', changed((line) => { line.price.unit_amount += 1; }), {}, {}],
    ['currency mutation', changed((line) => { line.price.currency = 'usd'; }), {}, {}],
    ['sync product mutation', changed((line) => { line.price.metadata.printful_sync_product_id = '1'; }), {}, {}],
    ['sync variant mutation', changed((line) => { line.price.metadata.printful_sync_variant_id = '2'; }), {}, {}],
    ['catalog variant mutation', changed((line) => { line.price.metadata.printful_catalog_variant_id = '3'; }), {}, {}],
    ['quantity mutation', changed((line) => { line.quantity = 2; }), {}, {}],
    ['recurring Price', changed((line) => { line.price.type = 'recurring'; line.price.recurring = {}; }), {}, {}],
    ['live Price in test checkout', changed((line) => { line.price.livemode = true; }), {}, {}],
    ['missing Price livemode', changed((line) => { delete line.price.livemode; }), {}, {}],
    ['null Price livemode', changed((line) => { line.price.livemode = null; }), {}, {}],
    ['string Price livemode', changed((line) => { line.price.livemode = 'false'; }), {}, {}],
    ['live Product in test checkout', changed((line) => { line.price.product.livemode = true; }), {}, {}],
    ['missing Product livemode', changed((line) => { delete line.price.product.livemode; }), {}, {}],
    ['null Product livemode', changed((line) => { line.price.product.livemode = null; }), {}, {}],
    ['string Product livemode', changed((line) => { line.price.product.livemode = 'false'; }), {}, {}],
    ['missing Session livemode', baseline, {}, { livemode: undefined }],
    ['null Session livemode', baseline, {}, { livemode: null }],
    ['string Session livemode', baseline, {}, { livemode: 'false' }],
    ['line count mutation', baseline, { vf_line_count: '2' }, {}],
    ['digest mutation', baseline, { vf_checkout_sha256: 'A'.repeat(43) }, {}],
    ['version mutation', baseline, { vf_checkout_version: '2' }, {}],
    ['missing provenance', baseline, {
      vf_checkout_version: undefined,
      vf_checkout_sha256: undefined,
      vf_line_count: undefined,
      vf_livemode: undefined,
    }, {}],
  ];

  for (const [name, candidate, sessionMetadata, sessionOverrides] of scenarios) {
    await t.test(name, async () => {
      const { handler, calls, currentSession } = createHarness({
        pages: [{ data: [candidate], has_more: false }],
        provenanceLines: expected,
        sessionMetadata,
        sessionOverrides,
      });
      const isSessionLivemodeMutation = name.includes('Session livemode');
      assert.equal((await handler(webhookEvent())).statusCode, isSessionLivemodeMutation ? 500 : 200);
      assert.equal(calls.drafts.length, 0);
      assert.equal(calls.customerEmails.length, 0);
      if (isSessionLivemodeMutation) {
        assert.equal(calls.ownerEmails.length, 0);
        return;
      }
      assert.equal(calls.ownerEmails.length, 1);
      assert.equal(calls.ownerEmails[0].failure.code, 'catalogue_mismatch');
      assert.equal(currentSession.metadata.fulfillment_status, 'permanent_failure');
    });
  }
});

test('duplicate Price IDs or Printful sync variants fail provenance before draft creation', async (t) => {
  const first = stripeLine(firstVariant);
  const second = stripeLine(secondVariant);
  const expected = [provenanceLine(first), provenanceLine(second)];
  const duplicatePrice = structuredClone(second);
  duplicatePrice.price.id = first.price.id;
  const duplicateVariant = structuredClone(second);
  duplicateVariant.price.metadata.printful_sync_variant_id = first.price.metadata.printful_sync_variant_id;

  for (const [name, data] of [
    ['duplicate Price', [first, duplicatePrice]],
    ['duplicate sync variant', [first, duplicateVariant]],
  ]) {
    await t.test(name, async () => {
      const { handler, calls } = createHarness({
        pages: [{ data, has_more: false }],
        provenanceLines: expected,
      });
      assert.equal((await handler(webhookEvent())).statusCode, 200);
      assert.equal(calls.drafts.length, 0);
      assert.equal(calls.ownerEmails[0].failure.code, 'catalogue_mismatch');
    });
  }
});

test('PaymentIntent shipping creates the exact recipient and maps state to state_code', async () => {
  const { handler, calls } = createHarness({
    shipping: {
      name: 'Léa Martin',
      phone: '+1 555 0100',
      address: {
        line1: '1 Main St', line2: 'Unit 2', city: 'Austin',
        postal_code: '78701', country: 'US', state: 'TX',
      },
    },
  });

  assert.equal((await handler(webhookEvent())).statusCode, 200);
  assert.deepEqual(calls.paymentIntentRetrievals, ['pi_test_123']);
  assert.deepEqual(calls.drafts[0].recipient, {
    name: 'Léa Martin',
    address1: '1 Main St',
    address2: 'Unit 2',
    city: 'Austin',
    zip: '78701',
    country_code: 'US',
    state_code: 'TX',
    email: 'lea@example.com',
    phone: '+1 555 0100',
  });
});

test('unsupported or incomplete paid shipping addresses are permanent owner-alert failures', async () => {
  const { handler, calls } = createHarness({
    shipping: {
      name: 'Léa Martin',
      address: { line1: 'Rua Teste', city: 'São Paulo', postal_code: '01000', country: 'BR' },
    },
  });
  assert.equal((await handler(webhookEvent())).statusCode, 200);
  assert.equal(calls.drafts.length, 0);
  assert.equal(calls.ownerEmails.length, 1);
  assert.equal(calls.ownerEmails[0].failure.code, 'invalid_shipping_address');
});

test('Printful external IDs hash the full Session ID into a deterministic 32-character URL-safe namespace', () => {
  const first = derivePrintfulExternalId(`cs_test_${'a'.repeat(80)}x`);
  const second = derivePrintfulExternalId(`cs_test_${'a'.repeat(80)}y`);
  assert.equal(first, derivePrintfulExternalId(`cs_test_${'a'.repeat(80)}x`));
  assert.match(first, /^vf_[A-Za-z0-9_-]{29}$/);
  assert.equal(first.length, 32);
  assert.notEqual(first, second);
});

test('draft creation stores both reconciliation IDs additively before either email', async () => {
  const { handler, calls } = createHarness({ sessionMetadata: { preserved: 'yes' } });
  assert.equal((await handler(webhookEvent())).statusCode, 200);
  assert.equal(calls.updates[0].metadata.preserved, 'yes');
  assert.equal(calls.updates[0].metadata.printful_draft_id, '987');
  assert.equal(calls.updates[0].metadata.printful_external_id, derivePrintfulExternalId('cs_test_123'));
  assert.equal(calls.updates[1].metadata.customer_email_sent, 'true');
  assert.equal(calls.updates[2].metadata.owner_email_sent, 'true');
  assert.equal(calls.ownerEmails[0].stripeSessionId, 'cs_test_123');
  assert.equal(calls.ownerEmails[0].printfulOrderId, 987);
});

test('customer and owner email retries resume from the last successful metadata checkpoint', async (t) => {
  await t.test('customer failure keeps draft and retries customer before owner', async () => {
    const { handler, calls } = createHarness({ customerEmailFailure: 'once' });
    assert.equal((await handler(webhookEvent())).statusCode, 500);
    assert.equal((await handler(webhookEvent())).statusCode, 200);
    assert.equal(calls.drafts.length, 1);
    assert.equal(calls.customerEmails.length, 2);
    assert.equal(calls.ownerEmails.length, 1);
  });
  await t.test('owner failure keeps customer checkpoint and retries only owner', async () => {
    const { handler, calls } = createHarness({ ownerEmailFailure: 'once' });
    assert.equal((await handler(webhookEvent())).statusCode, 500);
    assert.equal((await handler(webhookEvent())).statusCode, 200);
    assert.equal(calls.drafts.length, 1);
    assert.equal(calls.customerEmails.length, 1);
    assert.equal(calls.ownerEmails.length, 2);
  });
});

test('retryable Printful failures return 500 without emailing while permanent failures alert once', async (t) => {
  await t.test('retryable', async () => {
    const error = Object.assign(new Error('Printful private timeout'), { retryable: true });
    const { handler, calls } = createHarness({ printfulFailure: error });
    assert.equal((await handler(webhookEvent())).statusCode, 500);
    assert.equal(calls.customerEmails.length, 0);
    assert.equal(calls.ownerEmails.length, 0);
  });
  await t.test('permanent', async () => {
    const error = Object.assign(new Error('Printful draft mismatch'), { permanent: true });
    const { handler, calls } = createHarness({ printfulFailure: error });
    assert.equal((await handler(webhookEvent())).statusCode, 200);
    assert.equal((await handler(webhookEvent())).statusCode, 200);
    assert.equal(calls.customerEmails.length, 0);
    assert.equal(calls.ownerEmails.length, 1);
    assert.equal(calls.ownerEmails[0].failure.code, 'printful_rejected');
  });
});

test('Printful item mismatch alerts with only separated expected and actual lines', async () => {
  const mismatch = new PrintfulOrderError('Printful draft mismatch', {
    code: 'draft_mismatch',
    details: {
      expectedItems: [{ sync_variant_id: firstVariant.printful_sync_variant_id, quantity: 1 }],
      actualItems: [{ sync_variant_id: secondVariant.printful_sync_variant_id, quantity: 2 }],
      provider_body: 'private-token',
    },
  });
  const { handler, calls } = createHarness({ printfulFailure: mismatch });

  assert.equal((await handler(webhookEvent())).statusCode, 200);
  assert.equal(calls.customerEmails.length, 0);
  assert.equal(calls.ownerEmails.length, 1);
  assert.deepEqual(calls.ownerEmails[0].failure, {
    code: 'draft_mismatch',
    details: 'Printful draft items do not match the paid order.',
    expectedItems: [{ sync_variant_id: firstVariant.printful_sync_variant_id, quantity: 1 }],
    actualItems: [{ sync_variant_id: secondVariant.printful_sync_variant_id, quantity: 2 }],
  });
  assert.doesNotMatch(JSON.stringify(calls.ownerEmails[0].failure), /private-token|provider_body/);
});

test('a Printful response without a usable draft ID is permanent and alerts the owner', async () => {
  const { handler, calls } = createHarness({ printfulDraftId: null });
  assert.equal((await handler(webhookEvent())).statusCode, 200);
  assert.equal(calls.customerEmails.length, 0);
  assert.equal(calls.ownerEmails.length, 1);
  assert.equal(calls.ownerEmails[0].failure.code, 'printful_rejected');
});

test('a Printful response that is not an unconfirmed draft is permanent and alerts the owner', async () => {
  const { handler, calls } = createHarness({ printfulDraftStatus: 'fulfilled' });
  assert.equal((await handler(webhookEvent())).statusCode, 200);
  assert.equal(calls.customerEmails.length, 0);
  assert.equal(calls.ownerEmails.length, 1);
  assert.equal(calls.ownerEmails[0].failure.code, 'printful_rejected');
});

test('a permanent failure is retryable until its owner alert succeeds', async () => {
  const error = Object.assign(new Error('Printful draft mismatch'), { permanent: true });
  const { handler, calls } = createHarness({ printfulFailure: error, ownerEmailFailure: 'once' });
  assert.equal((await handler(webhookEvent())).statusCode, 500);
  assert.equal((await handler(webhookEvent())).statusCode, 200);
  assert.equal(calls.ownerEmails.length, 2);
});

test('Stripe retrieval failures return a redacted retryable response', async () => {
  const errors = [];
  const { handler } = createHarness({
    retrieveFailure: true,
    logger: { error: (...arguments_) => errors.push(arguments_) },
  });
  const response = await handler(webhookEvent());
  assert.equal(response.statusCode, 500);
  assert.doesNotMatch(response.body, /private retrieval/);
  assert.deepEqual(errors, [[
    'Paid-order webhook failed',
    { name: 'Error', retryable: true },
  ]]);
});

test('exported Netlify handler validates configuration before constructing authenticated clients', async () => {
  const names = [
    'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'PRINTFUL_API_KEY', 'PRINTFUL_TOKEN',
    'PRINTFUL_STORE_ID', 'EMAILJS_SERVICE_ID', 'EMAILJS_PUBLIC_KEY', 'EMAILJS_PRIVATE_KEY',
    'EMAILJS_CUSTOMER_TEMPLATE_ID', 'EMAILJS_OWNER_TEMPLATE_ID', 'VERTIFLOW_TEST_ACCESS_TOKEN',
  ];
  const saved = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  const originalConsoleError = console.error;
  const errors = [];
  for (const name of names) delete process.env[name];
  try {
    console.error = (...arguments_) => errors.push(arguments_);
    const response = await netlifyHandler(webhookEvent());
    assert.equal(response.statusCode, 500);
    assert.deepEqual(JSON.parse(response.body), { error: 'Webhook configuration error' });
    assert.deepEqual(errors, [['Webhook configuration failed']]);
  } finally {
    console.error = originalConsoleError;
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});

test('webhook environment accepts only test Stripe keys and survives access-token removal', () => {
  const environment = {
    STRIPE_SECRET_KEY: 'sk_test_example',
    STRIPE_WEBHOOK_SECRET: 'whsec_example',
    PRINTFUL_API_KEY: 'printful-example',
    PRINTFUL_STORE_ID: '15558986',
    EMAILJS_SERVICE_ID: 'service_example',
    EMAILJS_PUBLIC_KEY: 'public_example',
    EMAILJS_PRIVATE_KEY: 'private_example',
    EMAILJS_CUSTOMER_TEMPLATE_ID: 'template_customer',
    EMAILJS_OWNER_TEMPLATE_ID: 'template_owner',
    VERTIFLOW_TEST_ACCESS_TOKEN: TEST_ACCESS_TOKEN,
  };

  assert.doesNotThrow(() => validateWebhookEnvironment(environment));
  assert.throws(
    () => validateWebhookEnvironment({ ...environment, STRIPE_SECRET_KEY: 'sk_live_example' }),
    /test Stripe secret/i,
  );
  assert.doesNotThrow(() => validateWebhookEnvironment({
    ...environment,
    VERTIFLOW_TEST_ACCESS_TOKEN: undefined,
  }));
});
