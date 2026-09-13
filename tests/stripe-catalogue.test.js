const assert = require('node:assert/strict');
const test = require('node:test');
const {
  priceInMinorUnits,
  priceIdempotencyKey,
  priceLookupKey,
  productIdempotencyKey,
  reconcileCatalogue,
} = require('../scripts/lib/stripe-catalogue');
const {
  assertSafeStripeKey,
  countActiveReconciledVariants,
} = require('../scripts/sync-stripe-prices');

function createStripeDouble({
  existingProduct,
  existingProducts = existingProduct ? [existingProduct] : [],
  existingPrice,
} = {}) {
  const calls = [];
  let productId = 1;
  let priceId = 1;

  return {
    calls,
    products: {
      list: async () => ({ data: existingProducts, has_more: false }),
      retrieve: async (id) => ({ ...existingProduct, id }),
      create: async (params, options) => {
        calls.push(['products.create', params, options]);
        return { id: `prod_${productId++}`, ...params };
      },
      update: async (id, params) => {
        calls.push(['products.update', id, params]);
        return { id, ...params };
      },
    },
    prices: {
      list: async () => ({ data: existingPrice ? [existingPrice] : [] }),
      retrieve: async (id) => ({ ...existingPrice, id }),
      create: async (params, options) => {
        calls.push(['prices.create', params, options]);
        return { id: `price_${priceId++}`, active: true, ...params };
      },
      update: async (id, params) => {
        calls.push(['prices.update', id, params]);
        return { id, active: true, ...params };
      },
    },
  };
}

function createConcurrentStripeDouble() {
  const calls = [];
  const productsByIdempotencyKey = new Map();
  const pricesByIdempotencyKey = new Map();
  let pendingProductCreate = false;
  let releaseFirstProductCreate;
  const firstProductCreateReleased = new Promise((resolve) => {
    releaseFirstProductCreate = resolve;
  });

  return {
    calls,
    productsByIdempotencyKey,
    pricesByIdempotencyKey,
    products: {
      list: async () => ({ data: [...productsByIdempotencyKey.values()], has_more: false }),
      retrieve: async () => { throw new Error('unexpected product retrieval'); },
      create: async (params, options) => {
        calls.push(['products.create', params, options]);
        if (pendingProductCreate) {
          releaseFirstProductCreate();
          const error = new Error('idempotency key is in use');
          error.code = 'idempotency_key_in_use';
          throw error;
        }
        const existing = productsByIdempotencyKey.get(options.idempotencyKey);
        if (existing) return existing;
        const product = { id: `prod_${productsByIdempotencyKey.size + 1}`, ...params };
        productsByIdempotencyKey.set(options.idempotencyKey, product);
        pendingProductCreate = true;
        await firstProductCreateReleased;
        pendingProductCreate = false;
        return product;
      },
      update: async (id, params) => ({ id, ...params }),
    },
    prices: {
      list: async () => ({ data: [...pricesByIdempotencyKey.values()], has_more: false }),
      retrieve: async () => { throw new Error('unexpected price retrieval'); },
      create: async (params, options) => {
        calls.push(['prices.create', params, options]);
        const existing = pricesByIdempotencyKey.get(options.idempotencyKey);
        if (existing) return existing;
        const price = { id: `price_${pricesByIdempotencyKey.size + 1}`, active: true, ...params };
        pricesByIdempotencyKey.set(options.idempotencyKey, price);
        return price;
      },
      update: async (id, params) => ({ id, active: true, ...params }),
    },
  };
}

function createStatefulStripeDouble({
  existingProduct,
  existingPrice,
  existingPrices = existingPrice ? [existingPrice] : [],
  failArchiveOnce = false,
  failProductPriceList = false,
}) {
  const calls = [];
  const priceRecords = new Map(existingPrices.map((price) => [price.id, { ...price }]));
  let productId = 1;
  let priceId = 1;
  let shouldFailArchive = failArchiveOnce;

  return {
    calls,
    priceRecords,
    products: {
      list: async () => ({ data: existingProduct ? [existingProduct] : [], has_more: false }),
      retrieve: async (id) => ({ ...existingProduct, id }),
      create: async (params) => ({ id: `prod_${productId++}`, ...params }),
      update: async (id, params) => ({ id, ...params }),
    },
    prices: {
      list: async ({ lookup_keys: lookupKeys, product, limit, starting_after: startingAfter }) => {
        calls.push(['prices.list', { lookup_keys: lookupKeys, product, limit, starting_after: startingAfter }]);
        if (product && failProductPriceList) {
          throw new Error('product price listing failed');
        }
        const matchingPrices = [...priceRecords.values()].filter((price) => (
          price.active
          && (lookupKeys ? lookupKeys.includes(price.lookup_key) : price.product === product)
        ));
        const startIndex = startingAfter
          ? matchingPrices.findIndex((price) => price.id === startingAfter) + 1
          : 0;
        const data = matchingPrices.slice(startIndex, startIndex + (limit ?? matchingPrices.length));
        return {
          data,
          has_more: startIndex + data.length < matchingPrices.length,
        };
      },
      retrieve: async (id) => ({ ...priceRecords.get(id) }),
      create: async (params) => {
        calls.push(['prices.create', params]);
        if (params.transfer_lookup_key) {
          for (const price of priceRecords.values()) {
            if (price.lookup_key === params.lookup_key) delete price.lookup_key;
          }
        }
        const price = { id: `price_${priceId++}`, active: true, ...params };
        priceRecords.set(price.id, price);
        return { ...price };
      },
      update: async (id, params) => {
        calls.push(['prices.update', id, params]);
        const price = priceRecords.get(id);
        if (params.transfer_lookup_key) {
          for (const candidate of priceRecords.values()) {
            if (candidate.id !== id && candidate.lookup_key === params.lookup_key) {
              delete candidate.lookup_key;
            }
          }
        }
        if (params.active === false && shouldFailArchive) {
          shouldFailArchive = false;
          throw new Error('archive failed');
        }
        Object.assign(price, params);
        return { ...price };
      },
    },
  };
}

function catalogueFixture() {
  return {
    schema_version: 2,
    generated_at: '2026-07-17T00:00:00.000Z',
    currency: 'EUR',
    products: [
      {
        slug: 'hoodie-vf-definition',
        name: 'Hoodie VF Definition',
        price: '64.99',
        printful_sync_product_ids: [376418591, 377337480],
        stripe_product_id: null,
        thumbnail_url: 'https://example.com/hoodie.jpg',
        active: true,
        variants: [
          {
            color: 'Noir',
            size: 'M',
            printful_retail_price: '54.99',
            printful_sync_product_id: 376418591,
            printful_sync_variant_id: 9001,
            printful_catalog_variant_id: 4012,
            stripe_price_id: null,
            name: 'Black / M',
            image_url: null,
            active: true,
          },
        ],
      },
    ],
  };
}

test('Stripe lookup keys and minor units are deterministic', () => {
  assert.equal(
    priceLookupKey('hoodie-vf-definition', 9001, 'EUR'),
    'vertiflow_hoodie-vf-definition_9001_eur',
  );
  assert.equal(priceInMinorUnits('64.99'), 6499);
  assert.throws(() => priceInMinorUnits('0'), /Invalid catalogue retail price/);
});

test('Stripe idempotency keys hash bounded semantic transition inputs', () => {
  const transition = {
    productSlug: 'hoodie-vf-definition',
    syncVariantId: 9001,
    currency: 'EUR',
    unitAmount: 6499,
    stripeProductId: 'prod_target',
    priorActivePriceIds: ['price_z', 'price_a'],
    lookupKey: 'vertiflow_hoodie-vf-definition_9001_eur',
    transferLookupKey: true,
  };
  const sameTransitionDifferentOrder = {
    ...transition,
    priorActivePriceIds: ['price_a', 'price_z'],
  };
  const laterTransition = {
    ...transition,
    priorActivePriceIds: ['price_a', 'price_b'],
  };

  assert.equal(priceIdempotencyKey(transition), priceIdempotencyKey(sameTransitionDifferentOrder));
  assert.notEqual(priceIdempotencyKey(transition), priceIdempotencyKey(laterTransition));
  assert.notEqual(
    priceIdempotencyKey(transition),
    priceIdempotencyKey({ ...transition, stripeProductId: 'prod_other' }),
  );
  assert.ok(productIdempotencyKey('x'.repeat(1_000)).length <= 255);
  assert.ok(priceIdempotencyKey(transition).length <= 255);
});

test('Stripe reconciliation only permits test secret keys', () => {
  assert.doesNotThrow(() => assertSafeStripeKey('rk_test_example'));
  assert.doesNotThrow(() => assertSafeStripeKey('sk_test_example'));
  assert.throws(() => assertSafeStripeKey('rk_live_example'), /test-mode Stripe secret key/);
  assert.throws(() => assertSafeStripeKey('sk_live_example'), /test-mode Stripe secret key/);
  assert.throws(() => assertSafeStripeKey('not-a-stripe-key'), /test-mode Stripe secret key/);
});

test('reconcileCatalogue creates Stripe products and prices and records IDs', async () => {
  const stripe = createStripeDouble();

  const result = await reconcileCatalogue(stripe, catalogueFixture());

  assert.deepEqual(result.products[0].stripe_product_id, { test: 'prod_1', live: null });
  assert.deepEqual(result.products[0].variants[0].stripe_price_id, { test: 'price_1', live: null });
  assert.equal(stripe.calls[0][0], 'products.create');
  assert.equal(stripe.calls[1][0], 'prices.create');
  assert.equal(stripe.calls[1][1].unit_amount, 6499);
  assert.equal(stripe.calls[1][1].lookup_key, 'vertiflow_hoodie-vf-definition_9001_eur');
  assert.equal(stripe.calls[1][1].transfer_lookup_key, false);
  assert.deepEqual(stripe.calls[0][2], {
    idempotencyKey: productIdempotencyKey('hoodie-vf-definition'),
  });
  assert.deepEqual(stripe.calls[1][2], {
    idempotencyKey: priceIdempotencyKey({
      productSlug: 'hoodie-vf-definition',
      syncVariantId: 9001,
      currency: 'EUR',
      unitAmount: 6499,
      stripeProductId: 'prod_1',
      priorActivePriceIds: [],
      lookupKey: 'vertiflow_hoodie-vf-definition_9001_eur',
      transferLookupKey: false,
    }),
  });
  assert.equal(stripe.calls[0][1].metadata.commercial_slug, 'hoodie-vf-definition');
  assert.deepEqual(stripe.calls[1][1].metadata, {
    integration: 'vertiflow',
    printful_sync_product_id: '376418591',
    printful_sync_variant_id: '9001',
    printful_catalog_variant_id: '4012',
    commercial_slug: 'hoodie-vf-definition',
  });
});

test('reconcileCatalogue rejects ambiguous managed Products for a commercial slug', async () => {
  const existingProducts = ['prod_first', 'prod_second'].map((id) => ({
    id,
    metadata: { integration: 'vertiflow', commercial_slug: 'hoodie-vf-definition' },
  }));
  const stripe = createStripeDouble({ existingProducts });

  await assert.rejects(
    () => reconcileCatalogue(stripe, catalogueFixture()),
    /Multiple managed Stripe Products found for commercial slug hoodie-vf-definition/,
  );
});

test('concurrent reconciliation safely retries after an idempotency-key-in-use error', async () => {
  const stripe = createConcurrentStripeDouble();
  const results = await Promise.allSettled([
    reconcileCatalogue(stripe, catalogueFixture()),
    reconcileCatalogue(stripe, catalogueFixture()),
  ]);
  const fulfilled = results.find((result) => result.status === 'fulfilled');
  const rejected = results.find((result) => result.status === 'rejected');
  const retried = await reconcileCatalogue(stripe, catalogueFixture());

  assert.deepEqual(fulfilled.value.products[0].stripe_product_id, { test: 'prod_1', live: null });
  assert.deepEqual(fulfilled.value.products[0].variants[0].stripe_price_id, { test: 'price_1', live: null });
  assert.equal(rejected.reason.code, 'idempotency_key_in_use');
  assert.deepEqual(retried.products[0].stripe_product_id, { test: 'prod_1', live: null });
  assert.deepEqual(retried.products[0].variants[0].stripe_price_id, { test: 'price_1', live: null });
  assert.equal(stripe.productsByIdempotencyKey.size, 1);
  assert.equal(stripe.pricesByIdempotencyKey.size, 1);
  assert.deepEqual(
    stripe.calls.filter(([name]) => name === 'products.create').map(([, , options]) => options),
    [
      { idempotencyKey: productIdempotencyKey('hoodie-vf-definition') },
      { idempotencyKey: productIdempotencyKey('hoodie-vf-definition') },
    ],
  );
  assert.deepEqual(
    stripe.calls.filter(([name]) => name === 'prices.create').map(([, , options]) => options),
    [
      {
        idempotencyKey: priceIdempotencyKey({
          productSlug: 'hoodie-vf-definition',
          syncVariantId: 9001,
          currency: 'EUR',
          unitAmount: 6499,
          stripeProductId: 'prod_1',
          priorActivePriceIds: [],
          lookupKey: 'vertiflow_hoodie-vf-definition_9001_eur',
          transferLookupKey: false,
        }),
      },
    ],
  );
});

test('reconcileCatalogue reuses matching prices without creating duplicates', async () => {
  const existingProduct = {
    id: 'prod_existing',
    metadata: { integration: 'vertiflow', commercial_slug: 'hoodie-vf-definition' },
  };
  const existingPrice = {
    id: 'price_existing',
    active: true,
    currency: 'eur',
    unit_amount: 6499,
    product: 'prod_existing',
  };
  const stripe = createStripeDouble({ existingProduct, existingPrice });

  const result = await reconcileCatalogue(stripe, catalogueFixture());

  assert.deepEqual(result.products[0].stripe_product_id, { test: 'prod_existing', live: null });
  assert.deepEqual(result.products[0].variants[0].stripe_price_id, { test: 'price_existing', live: null });
  assert.equal(stripe.calls.some(([name]) => name === 'prices.create'), false);
  assert.deepEqual(
    stripe.calls.find(([name, id]) => name === 'prices.update' && id === 'price_existing'),
    ['prices.update', 'price_existing', {
      lookup_key: 'vertiflow_hoodie-vf-definition_9001_eur',
      transfer_lookup_key: true,
      metadata: {
        integration: 'vertiflow',
        printful_sync_product_id: '376418591',
        printful_sync_variant_id: '9001',
        printful_catalog_variant_id: '4012',
        commercial_slug: 'hoodie-vf-definition',
      },
      nickname: 'Black / M',
    }],
  );
});

test('reconcileCatalogue replaces changed immutable prices and archives the old one', async () => {
  const existingProduct = {
    id: 'prod_existing',
    metadata: { integration: 'vertiflow', commercial_slug: 'hoodie-vf-definition' },
  };
  const existingPrice = {
    id: 'price_old',
    active: true,
    currency: 'eur',
    unit_amount: 5999,
    product: 'prod_existing',
  };
  const stripe = createStripeDouble({ existingProduct, existingPrice });

  const result = await reconcileCatalogue(stripe, catalogueFixture());

  assert.deepEqual(result.products[0].variants[0].stripe_price_id, { test: 'price_1', live: null });
  const createCall = stripe.calls.find(([name]) => name === 'prices.create');
  assert.equal(createCall[1].transfer_lookup_key, true);
  assert.deepEqual(
    stripe.calls.find(([name, id]) => name === 'prices.update' && id === 'price_old'),
    ['prices.update', 'price_old', { active: false }],
  );
});

test('reconcileCatalogue recovers a created replacement after archival failure without duplicating it', async () => {
  const existingProduct = {
    id: 'prod_existing',
    metadata: { integration: 'vertiflow', commercial_slug: 'hoodie-vf-definition' },
  };
  const existingPrice = {
    id: 'price_old',
    active: true,
    currency: 'eur',
    unit_amount: 5999,
    product: 'prod_existing',
    lookup_key: 'vertiflow_hoodie-vf-definition_9001_eur',
    metadata: {
      integration: 'vertiflow',
      printful_sync_product_id: '376418591',
      printful_sync_variant_id: '9001',
    },
  };
  const stripe = createStatefulStripeDouble({ existingProduct, existingPrice, failArchiveOnce: true });

  await assert.rejects(
    () => reconcileCatalogue(stripe, catalogueFixture()),
    /archive failed/,
  );

  const result = await reconcileCatalogue(stripe, catalogueFixture());

  assert.deepEqual(result.products[0].variants[0].stripe_price_id, { test: 'price_1', live: null });
  assert.equal(stripe.calls.filter(([name]) => name === 'prices.create').length, 1);
  assert.equal(stripe.priceRecords.get('price_1').active, true);
  assert.equal(stripe.priceRecords.get('price_old').active, false);
});

test('reconcileCatalogue paginates product Prices to archive a duplicate on the second page', async () => {
  const existingProduct = {
    id: 'prod_existing',
    metadata: { integration: 'vertiflow', commercial_slug: 'hoodie-vf-definition' },
  };
  const variantMetadata = {
    integration: 'vertiflow',
    printful_sync_product_id: '376418591',
    printful_sync_variant_id: '9001',
  };
  const existingPrices = [
    {
      id: 'price_keep',
      active: true,
      currency: 'eur',
      unit_amount: 6499,
      product: 'prod_existing',
      metadata: variantMetadata,
    },
    ...Array.from({ length: 99 }, (_, index) => ({
      id: `price_filler_${index}`,
      active: true,
      currency: 'eur',
      unit_amount: 1000,
      product: 'prod_existing',
      metadata: {},
    })),
    {
      id: 'price_duplicate',
      active: true,
      currency: 'eur',
      unit_amount: 5999,
      product: 'prod_existing',
      metadata: variantMetadata,
    },
  ];
  const stripe = createStatefulStripeDouble({ existingProduct, existingPrices });
  const catalogue = catalogueFixture();
  catalogue.products[0].variants[0].stripe_price_id = 'price_keep';

  await reconcileCatalogue(stripe, catalogue);

  assert.equal(stripe.priceRecords.get('price_duplicate').active, false);
  assert.deepEqual(
    stripe.calls.filter(([name, params]) => name === 'prices.list' && params.product),
    [
      ['prices.list', { lookup_keys: undefined, product: 'prod_existing', limit: 100, starting_after: undefined }],
      ['prices.list', { lookup_keys: undefined, product: 'prod_existing', limit: 100, starting_after: 'price_filler_98' }],
    ],
  );
});

test('reconcileCatalogue propagates a product Price listing failure', async () => {
  const existingProduct = {
    id: 'prod_existing',
    metadata: { integration: 'vertiflow', commercial_slug: 'hoodie-vf-definition' },
  };
  const stripe = createStatefulStripeDouble({ existingProduct, failProductPriceList: true });

  await assert.rejects(
    () => reconcileCatalogue(stripe, catalogueFixture()),
    /product price listing failed/,
  );
});

test('countActiveReconciledVariants excludes inactive variants with retained Stripe IDs', () => {
  const catalogue = catalogueFixture();
  catalogue.products[0].variants[0].stripe_price_id = 'price_active';
  catalogue.products[0].variants.push({
    ...catalogue.products[0].variants[0],
    printful_sync_variant_id: 9002,
    stripe_price_id: 'price_inactive',
    active: false,
  });

  assert.equal(countActiveReconciledVariants(catalogue), 1);
});
