const assert = require('node:assert/strict');
const test = require('node:test');
const { loadProductsSchema } = require('../scripts/lib/products-schema');
const {
  assertSlugAvailable,
  assertValidPrice,
  assertNotBannedName,
  parseSizes,
  parseSizeAliases,
  ensureStripeProduct,
  ensureStripePrice,
  createStripeObjectsForMode,
  attachStripeIds,
} = require('../scripts/add-product');

const schema = loadProductsSchema();
const SLUG_PATTERN = new RegExp(schema.$defs.product.properties.slug.pattern);
const PRICE_PATTERN = new RegExp(schema.$defs.product.properties.price.pattern);

function extractMetadata(args) {
  const metadata = {};
  args.forEach((arg) => {
    const match = /^metadata\[(\w+)\]=(.*)$/.exec(arg);
    if (match) metadata[match[1]] = match[2];
  });
  return metadata;
}

function createFakeStripeRunner({ products = [], prices = [] } = {}) {
  const calls = [];
  let nextId = 1;

  const runner = (args) => {
    calls.push(args);
    const [resource, action] = args;

    if (resource === 'products' && action === 'list') {
      return JSON.stringify({ data: products, has_more: false });
    }
    if (resource === 'products' && action === 'create') {
      const created = {
        id: `prod_fake_${nextId++}`,
        name: args[args.indexOf('--name') + 1],
        metadata: extractMetadata(args),
      };
      products.push(created);
      return JSON.stringify(created);
    }
    if (resource === 'prices' && action === 'list') {
      return JSON.stringify({ data: prices, has_more: false });
    }
    if (resource === 'prices' && action === 'create') {
      const created = {
        id: `price_fake_${nextId++}`,
        unit_amount: Number(args[args.indexOf('--unit-amount') + 1]),
        metadata: extractMetadata(args),
      };
      prices.push(created);
      return JSON.stringify(created);
    }
    throw new Error(`Unhandled fake stripe args: ${args.join(' ')}`);
  };

  runner.calls = calls;
  return runner;
}

function fakeProduct(overrides = {}) {
  return { slug: 'veste-shell-vf', name: 'Veste Shell VF', price: '54.99', ...overrides };
}

function fakeVariant(overrides = {}) {
  return { color: 'Noir', size: 'M', printful_sync_variant_id: 4242, ...overrides };
}

test('assertSlugAvailable rejects an invalid slug', () => {
  assert.throws(
    () => assertSlugAvailable({ products: [] }, 'Not A Slug', SLUG_PATTERN),
    /is not a URL-safe slug/,
  );
});

test('assertSlugAvailable rejects a slug already in the catalogue', () => {
  const catalogue = { products: [{ slug: 'tshirt-climb' }] };
  assert.throws(
    () => assertSlugAvailable(catalogue, 'tshirt-climb', SLUG_PATTERN),
    /already exists in data\/products\.json — refusing to run/,
  );
});

test('assertSlugAvailable accepts a fresh, valid slug', () => {
  const catalogue = { products: [{ slug: 'tshirt-climb' }] };
  assert.doesNotThrow(() => assertSlugAvailable(catalogue, 'veste-shell-vf', SLUG_PATTERN));
});

test('assertValidPrice enforces the schema price pattern', () => {
  assert.throws(() => assertValidPrice('30', PRICE_PATTERN), /must look like 29\.99/);
  assert.throws(() => assertValidPrice('30.9', PRICE_PATTERN), /must look like 29\.99/);
  assert.doesNotThrow(() => assertValidPrice('30.00', PRICE_PATTERN));
});

test('assertNotBannedName refuses PKBA and Kenzi products, case-insensitively', () => {
  assert.throws(() => assertNotBannedName('Casquette PKBA', 'Product'), /must stay out of VertiFlow/);
  assert.throws(() => assertNotBannedName('kenzi hoodie', 'Printful source 1'), /must stay out of VertiFlow/);
  assert.doesNotThrow(() => assertNotBannedName('Veste Shell VF', 'Product'));
});

test('parseSizes trims, dedupes checking, and rejects empty input', () => {
  assert.deepEqual(parseSizes(' S, M ,L'), ['S', 'M', 'L']);
  assert.throws(() => parseSizes(''), /At least one size is required/);
  assert.throws(() => parseSizes('M,M'), /Sizes must be unique/);
});

test('parseSizeAliases returns undefined for blank input', () => {
  assert.equal(parseSizeAliases('  '), undefined);
});

test('parseSizeAliases parses PRINTFUL=PUBLIC pairs', () => {
  assert.deepEqual(parseSizeAliases('One size=M'), { 'One size': 'M' });
  assert.deepEqual(parseSizeAliases('One size=M, XL=Large'), { 'One size': 'M', XL: 'Large' });
});

test('parseSizeAliases rejects a malformed pair', () => {
  assert.throws(() => parseSizeAliases('One size'), /Invalid size alias/);
});

test('ensureStripeProduct creates once and reuses on a second call', () => {
  const runner = createFakeStripeRunner();
  const product = fakeProduct();

  const created = ensureStripeProduct(runner, 'test', product);
  assert.match(created.id, /^prod_fake_/);
  assert.equal(created.metadata.vf_slug, 'veste-shell-vf');

  const reused = ensureStripeProduct(runner, 'test', product);
  assert.equal(reused.id, created.id);

  const createCalls = runner.calls.filter((args) => args[0] === 'products' && args[1] === 'create');
  assert.equal(createCalls.length, 1);
});

test('ensureStripeProduct passes --live only in live mode', () => {
  const runner = createFakeStripeRunner();
  ensureStripeProduct(runner, 'live', fakeProduct());
  const [listCall] = runner.calls;
  assert.ok(listCall.includes('--live'));
});

test('ensureStripePrice creates once per color/size and reuses on a second call', () => {
  const runner = createFakeStripeRunner();
  const product = fakeProduct();
  const variant = fakeVariant();

  const created = ensureStripePrice(runner, 'test', product, variant, 'prod_fake_1', 'EUR');
  assert.match(created.id, /^price_fake_/);
  assert.equal(created.unit_amount, 5499);

  const reused = ensureStripePrice(runner, 'test', product, variant, 'prod_fake_1', 'EUR');
  assert.equal(reused.id, created.id);

  const createCalls = runner.calls.filter((args) => args[0] === 'prices' && args[1] === 'create');
  assert.equal(createCalls.length, 1);
});

test('createStripeObjectsForMode creates a product and one price per variant', () => {
  const runner = createFakeStripeRunner();
  const product = fakeProduct({
    variants: [fakeVariant({ color: 'Noir', size: 'M' }), fakeVariant({ color: 'Blanc', size: 'L', printful_sync_variant_id: 4243 })],
  });

  const result = createStripeObjectsForMode(runner, 'test', product, 'EUR');
  assert.match(result.productId, /^prod_fake_/);
  assert.equal(result.priceIdByVariant.size, 2);
  for (const variant of product.variants) {
    assert.ok(result.priceIdByVariant.get(variant));
  }
});

test('attachStripeIds sets both modes when Stripe succeeds twice', () => {
  const product = fakeProduct({ variants: [fakeVariant()] });
  const testRunner = createFakeStripeRunner();
  const liveRunner = createFakeStripeRunner();

  attachStripeIds(product, 'EUR', { testRunner, liveRunner });

  assert.ok(product.stripe_product_id.test);
  assert.ok(product.stripe_product_id.live);
  assert.ok(product.variants[0].stripe_price_id.test);
  assert.ok(product.variants[0].stripe_price_id.live);
});

test('attachStripeIds keeps test IDs and reports the error when live mode fails', () => {
  const product = fakeProduct({ variants: [fakeVariant()] });
  const testRunner = createFakeStripeRunner();
  const liveRunner = () => {
    throw new Error('more_permissions_required');
  };
  let reportedError;

  attachStripeIds(product, 'EUR', {
    testRunner,
    liveRunner,
    onLiveError: (error) => { reportedError = error; },
  });

  assert.ok(product.stripe_product_id.test);
  assert.equal(product.stripe_product_id.live, null);
  assert.ok(product.variants[0].stripe_price_id.test);
  assert.equal(product.variants[0].stripe_price_id.live, null);
  assert.match(reportedError.message, /more_permissions_required/);
});
