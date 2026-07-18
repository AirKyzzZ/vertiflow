const assert = require('node:assert/strict');
const test = require('node:test');
const {
  PrintfulClient,
  VERTIFLOW_PRINTFUL_STORE_ID,
  buildCommercialCatalogue,
  buildCatalogue,
  fetchCatalogue,
  mapWithConcurrency,
  normalizeRetailPrice,
  resolvePrintfulApiKey,
  slugify,
  validatePrintfulStoreId,
} = require('../scripts/lib/printful-catalogue');

test('Printful store validation accepts only the reviewed VertiFlow store before use', () => {
  assert.equal(VERTIFLOW_PRINTFUL_STORE_ID, '15558986');
  assert.equal(validatePrintfulStoreId('15558986'), '15558986');
  assert.throws(() => validatePrintfulStoreId(undefined), /PRINTFUL_STORE_ID must be 15558986/);
  assert.throws(() => validatePrintfulStoreId('99999999'), /PRINTFUL_STORE_ID must be 15558986/);
});

test('buildCommercialCatalogue rejects an individual allowlisted source with zero variants', () => {
  const input = {
    config: { products: [{
      slug: 'tee-vf', name: 'Tee VF', price: '29.99', sources: [
        { printful_sync_product_id: 42, color: 'Noir', sizes: ['M'] },
        { printful_sync_product_id: 43, color: 'Blanc', sizes: ['M'] },
      ],
    }] },
    productDetails: [
      { sync_product: { id: 42 }, sync_variants: [] },
      { sync_product: { id: 43 }, sync_variants: [{ id: 430, variant_id: 43 }] },
    ],
    catalogVariants: new Map([[43, { size: 'M' }]]),
  };
  assert.throws(
    () => buildCommercialCatalogue(input),
    /Allowlisted Printful product 42 has no variants/,
  );
});

test('buildCommercialCatalogue groups configured sources and preserves Stripe IDs', () => {
  const catalogue = buildCommercialCatalogue({
    config: {
      currency: 'EUR',
      products: [{
        slug: 'bob-vf',
        name: 'Bob VF',
        price: '24.99',
        sources: [{
          printful_sync_product_id: 42,
          color: 'Blanc',
          sizes: ['M'],
          size_aliases: { 'One size': 'M' },
        }],
      }],
    },
    generatedAt: '2026-07-17T00:00:00.000Z',
    existingCatalogue: {
      products: [{
        slug: 'bob-vf',
        stripe_product_id: 'prod_existing',
        variants: [{ printful_sync_variant_id: 9001, stripe_price_id: 'price_existing' }],
      }],
    },
    productDetails: [{
      sync_product: { id: 42, thumbnail_url: 'https://example.com/bob.jpg' },
      sync_variants: [{ id: 9001, variant_id: 4012, synced: true, is_ignored: false }],
    }],
    catalogVariants: new Map([[4012, { id: 4012, size: 'One size', color: 'White' }]]),
  });

  assert.deepEqual(catalogue, {
    schema_version: 2,
    generated_at: '2026-07-17T00:00:00.000Z',
    currency: 'EUR',
    products: [{
      slug: 'bob-vf',
      name: 'Bob VF',
      price: '24.99',
      printful_sync_product_ids: [42],
      stripe_product_id: 'prod_existing',
      variants: [{
        color: 'Blanc',
        size: 'M',
        printful_color: 'White',
        printful_size: 'One size',
        printful_sync_product_id: 42,
        printful_sync_variant_id: 9001,
        printful_catalog_variant_id: 4012,
        stripe_price_id: 'price_existing',
        image_url: 'https://example.com/bob.jpg',
        active: true,
      }],
    }],
  });
});

test('buildCommercialCatalogue rejects duplicate public options', () => {
  const input = {
    config: { products: [{
      slug: 'bob-vf', name: 'Bob VF', price: '24.99', sources: [
        { printful_sync_product_id: 42, color: 'Blanc', sizes: ['M'] },
        { printful_sync_product_id: 43, color: 'Blanc', sizes: ['M'] },
      ],
    }] },
    productDetails: [42, 43].map((id) => ({
      sync_product: { id }, sync_variants: [{ id: id * 10, variant_id: id }],
    })),
    catalogVariants: new Map([[42, { size: 'M' }], [43, { size: 'M' }]]),
  };
  assert.throws(() => buildCommercialCatalogue(input), /Duplicate public option bob-vf: Blanc \/ M/);
});

function commercialBuildInput({ sizes = ['M'], syncVariants } = {}) {
  return {
    config: { products: [{
      slug: 'tee-vf',
      name: 'Tee VF',
      price: '29.99',
      sources: [{ printful_sync_product_id: 42, color: 'Noir', sizes }],
    }] },
    productDetails: [{ sync_product: { id: 42 }, sync_variants: syncVariants }],
    catalogVariants: new Map([
      [420, { size: 'M' }],
      [421, { size: 'L' }],
    ]),
  };
}

test('buildCommercialCatalogue rejects new and removed Printful public sizes', () => {
  assert.throws(
    () => buildCommercialCatalogue(commercialBuildInput({
      sizes: ['M'],
      syncVariants: [{ id: 4200, variant_id: 420 }, { id: 4210, variant_id: 421 }],
    })),
    /Unexpected public size L for Printful product 42/,
  );
  assert.throws(
    () => buildCommercialCatalogue(commercialBuildInput({
      sizes: ['M', 'L'],
      syncVariants: [{ id: 4200, variant_id: 420 }],
    })),
    /Missing configured public size L for Printful product 42/,
  );
});

test('buildCommercialCatalogue rejects ignored and unsynchronized Printful variants', () => {
  assert.throws(
    () => buildCommercialCatalogue(commercialBuildInput({
      syncVariants: [{ id: 4200, variant_id: 420, is_ignored: true }],
    })),
    /Inactive Printful sync variant 4200 for product 42/,
  );
  assert.throws(
    () => buildCommercialCatalogue(commercialBuildInput({
      syncVariants: [{ id: 4200, variant_id: 420, synced: false }],
    })),
    /Inactive Printful sync variant 4200 for product 42/,
  );
});

test('slugify produces stable URL-safe French slugs', () => {
  assert.equal(slugify('Débardeur VF — Été 2026'), 'debardeur-vf-ete-2026');
});

test('normalizeRetailPrice rejects missing or non-positive prices', () => {
  assert.equal(normalizeRetailPrice('29.9'), '29.90');
  assert.throws(() => normalizeRetailPrice('0'), /Invalid Printful retail price/);
  assert.throws(() => normalizeRetailPrice('free'), /Invalid Printful retail price/);
});

test('Printful token resolution preserves a populated canonical key precedence', () => {
  assert.equal(
    resolvePrintfulApiKey({ PRINTFUL_API_KEY: 'canonical', PRINTFUL_TOKEN: 'alias' }),
    'canonical',
  );
});

test('Printful token resolution falls back when the canonical key is empty', () => {
  assert.equal(
    resolvePrintfulApiKey({ PRINTFUL_API_KEY: '', PRINTFUL_TOKEN: '  alias  ' }),
    'alias',
  );
});

test('Printful token resolution falls back when the canonical key is whitespace', () => {
  assert.equal(
    resolvePrintfulApiKey({ PRINTFUL_API_KEY: '   ', PRINTFUL_TOKEN: '\talias\n' }),
    'alias',
  );
});

test('Printful token resolution rejects absent and whitespace-only credentials', () => {
  assert.equal(resolvePrintfulApiKey({}), undefined);
  assert.equal(resolvePrintfulApiKey({ PRINTFUL_TOKEN: '   ' }), undefined);
  assert.equal(
    resolvePrintfulApiKey({ PRINTFUL_API_KEY: '\t', PRINTFUL_TOKEN: '\n' }),
    undefined,
  );
});

test('buildCatalogue preserves fulfillment and catalogue variant IDs', () => {
  const catalogue = buildCatalogue({
    generatedAt: '2026-07-17T00:00:00.000Z',
    currency: 'eur',
    existingCatalogue: {
      products: [
        {
          printful_sync_product_id: 42,
          stripe_product_id: 'prod_existing',
          variants: [
            {
              printful_sync_variant_id: 9001,
              stripe_price_id: 'price_existing',
            },
          ],
        },
      ],
    },
    productDetails: [
      {
        sync_product: {
          id: 42,
          external_id: 'vf-hoodie',
          name: 'Hoodie VF Définition',
          thumbnail_url: 'https://example.com/hoodie.jpg',
        },
        sync_variants: [
          {
            id: 9001,
            variant_id: 4012,
            external_id: 'vf-hoodie-black-m',
            name: 'Hoodie VF Définition - Black / M',
            retail_price: '64.99',
            sku: 'VF-HOODIE-BLK-M',
            synced: true,
            is_ignored: false,
            files: [{ visible: true, preview_url: 'https://example.com/mockup.jpg' }],
          },
        ],
      },
    ],
    catalogVariants: new Map([
      [
        4012,
        {
          id: 4012,
          name: 'Black / M',
          size: 'M',
          color: 'Black',
          color_code: '#0b0b0b',
        },
      ],
    ]),
  });

  assert.deepEqual(catalogue, {
    schema_version: 1,
    generated_at: '2026-07-17T00:00:00.000Z',
    currency: 'EUR',
    products: [
      {
        slug: 'hoodie-vf-definition',
        name: 'Hoodie VF Définition',
        printful_sync_product_id: 42,
        stripe_product_id: 'prod_existing',
        external_id: 'vf-hoodie',
        thumbnail_url: 'https://example.com/hoodie.jpg',
        active: true,
        variants: [
          {
            printful_sync_variant_id: 9001,
            printful_catalog_variant_id: 4012,
            stripe_price_id: 'price_existing',
            external_id: 'vf-hoodie-black-m',
            sku: 'VF-HOODIE-BLK-M',
            name: 'Hoodie VF Définition - Black / M',
            size: 'M',
            color: 'Black',
            color_code: '#0b0b0b',
            retail_price: '64.99',
            image_url: 'https://example.com/mockup.jpg',
            active: true,
          },
        ],
      },
    ],
  });
});

test('buildCatalogue disambiguates duplicate product slugs', () => {
  const productDetails = [101, 102].map((id) => ({
    sync_product: { id, name: 'T-shirt CLIMB' },
    sync_variants: [{ id: id * 10, variant_id: id, retail_price: '29.99' }],
  }));
  const catalogVariants = new Map([
    [101, { id: 101, size: 'M', color: 'Black' }],
    [102, { id: 102, size: 'L', color: 'White' }],
  ]);

  const catalogue = buildCatalogue({ productDetails, catalogVariants });

  assert.deepEqual(
    catalogue.products.map((product) => product.slug),
    ['t-shirt-climb', 't-shirt-climb-102'],
  );
});

test('PrintfulClient sends account-level store headers and paginates', async () => {
  const requests = [];
  const pages = [
    { code: 200, result: [{ id: 1 }], paging: { total: 2 } },
    { code: 200, result: [{ id: 2 }], paging: { total: 2 } },
  ];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    const body = pages.shift();
    return new Response(JSON.stringify(body), { status: 200 });
  };
  const client = new PrintfulClient({ apiKey: 'test-token', storeId: 123, fetchImpl });

  const products = await client.getSyncProducts();

  assert.deepEqual(products, [{ id: 1 }, { id: 2 }]);
  assert.equal(requests.length, 2);
  assert.equal(requests[0].options.headers.Authorization, 'Bearer test-token');
  assert.equal(requests[0].options.headers['X-PF-Store-Id'], '123');
  assert.equal(requests[1].url.searchParams.get('offset'), '1');
});

test('mapWithConcurrency preserves order and bounds active requests', async () => {
  let activeRequests = 0;
  let maximumActiveRequests = 0;

  const results = await mapWithConcurrency([1, 2, 3, 4], 2, async (value) => {
    activeRequests += 1;
    maximumActiveRequests = Math.max(maximumActiveRequests, activeRequests);
    await new Promise((resolve) => setImmediate(resolve));
    activeRequests -= 1;
    return value * 2;
  });

  assert.deepEqual(results, [2, 4, 6, 8]);
  assert.equal(maximumActiveRequests, 2);
});

test('fetchCatalogue refuses to replace the catalogue with an empty store', async () => {
  const client = {
    getSyncProducts: async () => [],
  };

  await assert.rejects(
    () => fetchCatalogue(client),
    /refusing to overwrite the catalogue/,
  );
});
