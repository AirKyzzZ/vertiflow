const assert = require('node:assert/strict');
const test = require('node:test');

const {
  resolveCart, validateCustomer, priceIdFor, productIdFor,
} = require('../functions/lib/catalogue');

function catalogueFixture() {
  return {
    currency: 'EUR',
    products: [{
      slug: 'hoodie-vf-definition',
      name: 'Hoodie VF Definition',
      price: '64.99',
      stripe_product_id: 'prod_test_hoodie',
      active: true,
      variants: [{
        color: 'Noir',
        size: 'M',
        active: true,
        stripe_price_id: 'price_test_hoodie_black_m',
        printful_sync_product_id: 8001,
        printful_sync_variant_id: 9001,
        printful_catalog_variant_id: 10001,
      }],
    }],
  };
}

function liveCatalogueFixture() {
  const fixture = catalogueFixture();
  fixture.products[0].stripe_product_id = { test: 'prod_test_hoodie', live: 'prod_live_hoodie' };
  fixture.products[0].variants[0].stripe_price_id = {
    test: 'price_test_hoodie_black_m', live: 'price_live_hoodie_black_m',
  };
  return fixture;
}

function customerFixture(overrides = {}) {
  return {
    firstName: 'Léa',
    lastName: 'Martin',
    email: 'lea@example.com',
    phone: '',
    address: {
      line1: '1 rue du Test',
      line2: '',
      city: 'Bordeaux',
      postal_code: '33000',
      country: 'FR',
      state: '',
    },
    ...overrides,
  };
}

test('resolveCart ignores browser prices and returns immutable reviewed line facts', () => {
  const result = resolveCart(catalogueFixture(), [{
    slug: 'hoodie-vf-definition', color: 'Noir', size: 'M', quantity: 2, price: 0.01,
  }], 'test');

  assert.deepEqual(result, [{
    priceId: 'price_test_hoodie_black_m',
    stripeProductId: 'prod_test_hoodie',
    currency: 'eur',
    unitAmount: 6499,
    slug: 'hoodie-vf-definition',
    syncProductId: 8001,
    syncVariantId: 9001,
    catalogVariantId: 10001,
    quantity: 2,
    name: 'Hoodie VF Definition',
    color: 'Noir',
    size: 'M',
  }]);
});

test('resolveCart rejects unknown, inactive, duplicate, and incomplete catalogue options', () => {
  const catalogue = catalogueFixture();
  catalogue.products[0].variants.push({
    color: 'Blanc', size: 'M', active: false, stripe_price_id: 'price_inactive', printful_sync_variant_id: 9002,
  });
  catalogue.products[0].variants.push({
    color: 'Noir', size: 'L', active: true, stripe_price_id: '', printful_sync_variant_id: 9003,
  });

  for (const item of [
    { slug: 'pkba-shorts', color: 'Blanc', size: 'M', quantity: 1 },
    { slug: 'hoodie-vf-definition', color: 'Blanc', size: 'M', quantity: 1 },
    { slug: 'hoodie-vf-definition', color: 'Noir', size: 'L', quantity: 1 },
  ]) {
    assert.throws(() => resolveCart(catalogue, [item], 'test'), /Unknown catalogue option/);
  }

  catalogue.products[0].variants.push({
    ...catalogue.products[0].variants[0],
  });
  assert.throws(
    () => resolveCart(catalogue, [{ slug: 'hoodie-vf-definition', color: 'Noir', size: 'M', quantity: 1 }], 'test'),
    /Duplicate catalogue option/,
  );
});

test('resolveCart bounds cart lines and quantities', () => {
  const item = { slug: 'hoodie-vf-definition', color: 'Noir', size: 'M', quantity: 1 };
  assert.throws(() => resolveCart(catalogueFixture(), [], 'test'), /at least one item/);
  assert.throws(() => resolveCart(catalogueFixture(), Array.from({ length: 101 }, () => item), 'test'), /at most 100/);
  for (const quantity of [0, 1.5, 11, '1']) {
    assert.throws(() => resolveCart(catalogueFixture(), [{ ...item, quantity }], 'test'), /quantity/);
  }
});

test('resolveCart requires every immutable catalogue fact and an exact reviewed price', () => {
  const item = { slug: 'hoodie-vf-definition', color: 'Noir', size: 'M', quantity: 1 };
  for (const mutate of [
    (catalogue) => { catalogue.currency = 'EURO'; },
    (catalogue) => { catalogue.products[0].price = '64.999'; },
    (catalogue) => { catalogue.products[0].price = '6.4e1'; },
    (catalogue) => { catalogue.products[0].stripe_product_id = ''; },
    (catalogue) => { catalogue.products[0].variants[0].printful_sync_product_id = 0; },
    (catalogue) => { catalogue.products[0].variants[0].printful_sync_variant_id = 0; },
    (catalogue) => { catalogue.products[0].variants[0].printful_catalog_variant_id = 0; },
  ]) {
    const catalogue = catalogueFixture();
    mutate(catalogue);
    assert.throws(() => resolveCart(catalogue, [item], 'test'), /Invalid catalogue|Unknown catalogue option/);
  }
});

test('resolveCart requires an explicit test or live mode', () => {
  const item = { slug: 'hoodie-vf-definition', color: 'Noir', size: 'M', quantity: 1 };
  for (const mode of [undefined, null, '', 'production', 'TEST']) {
    assert.throws(() => resolveCart(catalogueFixture(), [item], mode), /Invalid checkout mode/);
  }
});

test('resolveCart resolves live Stripe ids from a mode-keyed catalogue', () => {
  const result = resolveCart(liveCatalogueFixture(), [{
    slug: 'hoodie-vf-definition', color: 'Noir', size: 'M', quantity: 1,
  }], 'live');

  assert.equal(result[0].priceId, 'price_live_hoodie_black_m');
  assert.equal(result[0].stripeProductId, 'prod_live_hoodie');
});

test('resolveCart still resolves the test price from the same mode-keyed catalogue', () => {
  const result = resolveCart(liveCatalogueFixture(), [{
    slug: 'hoodie-vf-definition', color: 'Noir', size: 'M', quantity: 1,
  }], 'test');

  assert.equal(result[0].priceId, 'price_test_hoodie_black_m');
  assert.equal(result[0].stripeProductId, 'prod_test_hoodie');
});

test('resolveCart rejects a variant with no live price as an unknown catalogue option', () => {
  const fixture = catalogueFixture();
  fixture.products[0].variants[0].stripe_price_id = { test: 'price_test_hoodie_black_m', live: null };
  assert.throws(
    () => resolveCart(fixture, [{ slug: 'hoodie-vf-definition', color: 'Noir', size: 'M', quantity: 1 }], 'live'),
    /Unknown catalogue option/,
  );
});

test('resolveCart rejects a legacy flat-string price id requested in live mode', () => {
  assert.throws(
    () => resolveCart(catalogueFixture(), [{ slug: 'hoodie-vf-definition', color: 'Noir', size: 'M', quantity: 1 }], 'live'),
    /Unknown catalogue option/,
  );
});

test('priceIdFor resolves the requested mode and treats a legacy string as test-only', () => {
  assert.equal(priceIdFor({ stripe_price_id: 'price_legacy' }, 'test'), 'price_legacy');
  assert.throws(() => priceIdFor({ stripe_price_id: 'price_legacy' }, 'live'), /No live Stripe price configured/);
  assert.equal(priceIdFor({ stripe_price_id: { test: 'price_t', live: 'price_l' } }, 'test'), 'price_t');
  assert.equal(priceIdFor({ stripe_price_id: { test: 'price_t', live: 'price_l' } }, 'live'), 'price_l');
});

test('priceIdFor throws a clear error for a variant missing a price in the requested mode', () => {
  assert.throws(
    () => priceIdFor({ stripe_price_id: { test: 'price_t', live: null } }, 'live'),
    /No live Stripe price configured/,
  );
  assert.throws(() => priceIdFor({}, 'live'), /No live Stripe price configured/);
  assert.throws(() => priceIdFor({ stripe_price_id: 'price_t' }, 'nope'), /Invalid checkout mode/);
});

test('productIdFor resolves the requested mode and treats a legacy string as test-only', () => {
  assert.equal(productIdFor({ stripe_product_id: 'prod_legacy' }, 'test'), 'prod_legacy');
  assert.throws(() => productIdFor({ stripe_product_id: 'prod_legacy' }, 'live'), /No live Stripe product configured/);
  assert.equal(productIdFor({ stripe_product_id: { test: 'prod_t', live: 'prod_l' } }, 'live'), 'prod_l');
});

test('productIdFor throws a clear error for a product missing an id in the requested mode', () => {
  assert.throws(
    () => productIdFor({ stripe_product_id: { test: 'prod_t', live: null } }, 'live'),
    /No live Stripe product configured/,
  );
  assert.throws(() => productIdFor({}, 'live'), /No live Stripe product configured/);
});

test('validateCustomer trims allowed fields and validates ISO address requirements', () => {
  const customer = validateCustomer(customerFixture({
    firstName: ' Léa ', lastName: ' Martin ', email: ' lea@example.com ', phone: ' +33612345678 ',
  }));
  assert.deepEqual(customer, {
    firstName: 'Léa', lastName: 'Martin', email: 'lea@example.com', phone: '+33612345678',
    address: {
      line1: '1 rue du Test', line2: '', city: 'Bordeaux', postal_code: '33000', country: 'FR', state: '',
    },
  });

  assert.throws(() => validateCustomer(customerFixture({ address: { ...customerFixture().address, country: 'UK' } })), /GB/);
  assert.throws(() => validateCustomer(customerFixture({ address: { ...customerFixture().address, country: 'ZZ' } })), /country/);
  assert.throws(() => validateCustomer(customerFixture({ address: { ...customerFixture().address, country: 'US' } })), /state/);
  assert.throws(() => validateCustomer(customerFixture({ email: 'not-an-email' })), /email/);
});

test('validateCustomer rejects fields exceeding Stripe-safe limits after trimming', () => {
  const overlong = 'x'.repeat(501);
  for (const customer of [
    customerFixture({ firstName: overlong }),
    customerFixture({ lastName: overlong }),
    customerFixture({ email: `${'a'.repeat(490)}@example.com` }),
    customerFixture({ phone: overlong }),
    customerFixture({ address: { ...customerFixture().address, line1: overlong } }),
    customerFixture({ address: { ...customerFixture().address, line2: overlong } }),
    customerFixture({ address: { ...customerFixture().address, city: overlong } }),
    customerFixture({ address: { ...customerFixture().address, postal_code: overlong } }),
    customerFixture({ address: { ...customerFixture().address, state: overlong } }),
  ]) {
    assert.throws(() => validateCustomer(customer), /too long/);
  }
});
