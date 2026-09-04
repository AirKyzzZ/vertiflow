const assert = require('node:assert/strict');
const test = require('node:test');
const { loadProductsSchema, validateProductsCatalogue } = require('../scripts/lib/products-schema');

function buildProduct(overrides = {}) {
  return {
    slug: 'tshirt-climb',
    name: 'T-shirt CLIMB',
    price: '29.99',
    printful_sync_product_ids: [376170525],
    stripe_product_id: null,
    variants: [
      {
        color: 'Noir',
        size: 'M',
        printful_color: 'Black',
        printful_size: 'M',
        printful_sync_product_id: 376170525,
        printful_sync_variant_id: 111,
        printful_catalog_variant_id: 222,
        stripe_price_id: null,
        image_url: null,
        active: true,
      },
    ],
    ...overrides,
  };
}

function buildCatalogue(products) {
  return {
    schema_version: 2,
    generated_at: '2026-01-01T00:00:00.000Z',
    currency: 'EUR',
    products,
  };
}

function nineProducts() {
  return Array.from({ length: 9 }, (_, index) => buildProduct({ slug: `product-${index}` }));
}

test('loadProductsSchema reads the committed schema file', () => {
  const schema = loadProductsSchema();
  assert.equal(schema.$id, 'https://vertiflow.fr/schemas/products.schema.json');
});

test('accepts the current nine-product shape', () => {
  assert.doesNotThrow(() => validateProductsCatalogue(buildCatalogue(nineProducts())));
});

test('accepts more than nine products now that the ceiling is removed', () => {
  const products = [...nineProducts(), buildProduct({ slug: 'tenth-product' })];
  assert.doesNotThrow(() => validateProductsCatalogue(buildCatalogue(products)));
});

test('rejects fewer than nine products', () => {
  assert.throws(
    () => validateProductsCatalogue(buildCatalogue(nineProducts().slice(0, 3))),
    /catalogue\.products must contain at least 9 products/,
  );
});

test('rejects a duplicated slug', () => {
  const products = [buildProduct(), buildProduct()];
  assert.throws(
    () => validateProductsCatalogue(buildCatalogue([...nineProducts().slice(1), ...products])),
    /slug "tshirt-climb" is duplicated/,
  );
});

test('rejects an unknown top-level key', () => {
  const catalogue = { ...buildCatalogue(nineProducts()), extra: true };
  assert.throws(() => validateProductsCatalogue(catalogue), /catalogue has unexpected or missing properties/);
});

test('rejects a bad slug', () => {
  const products = [buildProduct({ slug: 'Not A Slug' }), ...nineProducts().slice(1)];
  assert.throws(() => validateProductsCatalogue(buildCatalogue(products)), /slug does not match the schema pattern/);
});

test('rejects a bad price', () => {
  const products = [buildProduct({ price: '30' }), ...nineProducts().slice(1)];
  assert.throws(() => validateProductsCatalogue(buildCatalogue(products)), /price does not match the schema pattern/);
});

test('rejects three printful_sync_product_ids', () => {
  const products = [
    buildProduct({ printful_sync_product_ids: [1, 2, 3] }),
    ...nineProducts().slice(1),
  ];
  assert.throws(
    () => validateProductsCatalogue(buildCatalogue(products)),
    /printful_sync_product_ids must contain between 1 and 2 unique IDs/,
  );
});

test('accepts a mode-keyed stripe_product_id and stripe_price_id', () => {
  const products = [
    buildProduct({
      stripe_product_id: { test: 'prod_test123', live: null },
      variants: [
        {
          ...buildProduct().variants[0],
          stripe_price_id: { test: 'price_test123', live: 'price_live123' },
        },
      ],
    }),
    ...nineProducts().slice(1),
  ];
  assert.doesNotThrow(() => validateProductsCatalogue(buildCatalogue(products)));
});

test('rejects a stripe_product_id object missing the live key', () => {
  const products = [
    buildProduct({ stripe_product_id: { test: 'prod_test123' } }),
    ...nineProducts().slice(1),
  ];
  assert.throws(
    () => validateProductsCatalogue(buildCatalogue(products)),
    /stripe_product_id has unexpected or missing properties/,
  );
});

test('rejects an inactive variant', () => {
  const products = [
    buildProduct({ variants: [{ ...buildProduct().variants[0], active: false }] }),
    ...nineProducts().slice(1),
  ];
  assert.throws(() => validateProductsCatalogue(buildCatalogue(products)), /active must be true/);
});
