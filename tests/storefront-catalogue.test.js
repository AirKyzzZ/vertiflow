const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const config = require('../data/storefront-products.json');
const catalogue = require('../data/products.json');
const {
  validateAllowlistedProducts,
  validateCommercialCatalogue,
} = require('../scripts/lib/printful-catalogue');
const {
  main: syncCommercialCatalogue,
  writeValidatedCatalogueAtomically,
} = require('../scripts/sync-printful-catalogue');

test('commercial config contains only the approved VertiFlow products', () => {
  assert.equal(config.products.length, 9);
  assert.deepEqual(
    config.products.map(({ slug, price }) => [slug, price]),
    [
      ['tshirt-climb', '29.99'],
      ['hoodie-vf-definition', '64.99'],
      ['casquette-vf', '29.99'],
      ['shorts-performance-vf', '47.99'],
      ['coque-iphone-vf', '29.99'],
      ['debardeur-vf', '19.99'],
      ['cache-cou-vf', '24.99'],
      ['bob-vf', '24.99'],
      ['short-confort-vf', '29.99'],
    ],
  );
  const ids = config.products.flatMap((product) =>
    product.sources.map((source) => source.printful_sync_product_id));
  assert.deepEqual(ids.sort((a, b) => a - b), [
    376170525, 376418591, 376418706, 376418808, 376418868,
    376418913, 377330919, 377337480, 377338525, 377338630,
    377417508, 385121662, 385122205, 385122974, 385123410,
  ]);
});

test('commercial config pins every product source ID, public color, and size in order', () => {
  assert.deepEqual(
    config.products.map(({ slug, sources }) => [
      slug,
      sources.map(({ printful_sync_product_id, color, sizes }) => [
        printful_sync_product_id,
        color,
        sizes,
      ]),
    ]),
    [
      ['tshirt-climb', [[376170525, 'Noir', ['S', 'M', 'L', 'XL', '2XL']], [377330919, 'Blanc', ['S', 'M', 'L', 'XL', '2XL']]]],
      ['hoodie-vf-definition', [[376418591, 'Noir', ['S', 'M', 'L', 'XL', '2XL']], [377337480, 'Blanc', ['S', 'M', 'L', 'XL', '2XL']]]],
      ['casquette-vf', [[376418706, 'Noir', ['One size']], [377338630, 'Blanc', ['One size']]]],
      ['shorts-performance-vf', [[376418808, 'Noir', ['2XS', 'XS', 'S', 'M', 'L', 'XL', '2XL']], [377338525, 'Blanc', ['2XS', 'XS', 'S', 'M', 'L', 'XL', '2XL']]]],
      ['coque-iphone-vf', [[377417508, 'Noir', ['iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max', 'iPhone 12 Mini', 'iPhone 12', 'iPhone 12 Pro', 'iPhone 12 Pro Max', 'iPhone 13 Mini', 'iPhone 13', 'iPhone 13 Pro', 'iPhone 13 Pro Max', 'iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max', 'iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max', 'iPhone 16', 'iPhone 16 Plus', 'iPhone 16 Pro', 'iPhone 16 Pro Max']], [376418868, 'Blanc', ['iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max', 'iPhone 12 Mini', 'iPhone 12', 'iPhone 12 Pro', 'iPhone 12 Pro Max', 'iPhone 13 Mini', 'iPhone 13', 'iPhone 13 Pro', 'iPhone 13 Pro Max', 'iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max', 'iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max', 'iPhone 16', 'iPhone 16 Plus', 'iPhone 16 Pro', 'iPhone 16 Pro Max']]]],
      ['debardeur-vf', [[385121662, 'Noir', ['XS', 'S', 'M', 'L', 'XL', '2XL']], [385122205, 'Blanc', ['XS', 'S', 'M', 'L', 'XL', '2XL']]]],
      ['cache-cou-vf', [[376418913, 'Noir', ['M']]]],
      ['bob-vf', [[385122974, 'Blanc', ['M']]]],
      ['short-confort-vf', [[385123410, 'Blanc', ['2XS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL']]]],
    ],
  );
});

test('generated catalogue contains nine approved products and 107 public variants', () => {
  assert.equal(catalogue.schema_version, 2);
  assert.equal(catalogue.products.length, 9);
  assert.equal(catalogue.products.flatMap((product) => product.variants).length, 107);
  assert.equal(catalogue.products.flatMap((product) => product.variants).every((variant) => variant.active), true);
  assert.equal(catalogue.products.some((product) => /pkba|kenzi/i.test(product.name)), false);
  const bob = catalogue.products.find((product) => product.slug === 'bob-vf');
  assert.equal(bob.variants[0].size, 'M');
  assert.equal(bob.variants[0].printful_size, 'One size');
  assert.doesNotThrow(() => validateCommercialCatalogue(catalogue, config));
});

test('synchronizer rejects a foreign Printful store before constructing a client', async (t) => {
  const originalStoreId = process.env.PRINTFUL_STORE_ID;
  t.after(() => {
    if (originalStoreId === undefined) delete process.env.PRINTFUL_STORE_ID;
    else process.env.PRINTFUL_STORE_ID = originalStoreId;
  });
  process.env.PRINTFUL_STORE_ID = '99999999';
  await assert.rejects(syncCommercialCatalogue(), /PRINTFUL_STORE_ID must be 15558986/);
});

test('commercial catalogue validation rejects empty required strings', () => {
  const invalidCatalogue = structuredClone(catalogue);
  invalidCatalogue.products[0].name = '';
  assert.throws(
    () => validateCommercialCatalogue(invalidCatalogue),
    /products\[0\]\.name must be a non-empty string/,
  );
});

test('commercial catalogue validation requires an ISO date-time', () => {
  const invalidCatalogue = structuredClone(catalogue);
  invalidCatalogue.generated_at = '2026-07-17';
  assert.throws(
    () => validateCommercialCatalogue(invalidCatalogue),
    /catalogue\.generated_at must be a date-time string/,
  );
});

test('commercial catalogue validation rejects more than two source IDs without config', () => {
  const invalidCatalogue = structuredClone(catalogue);
  invalidCatalogue.products[0].printful_sync_product_ids = [1, 2, 3];
  assert.throws(
    () => validateCommercialCatalogue(invalidCatalogue),
    /products\[0\]\.printful_sync_product_ids must contain one or two unique IDs/,
  );
});

test('commercial catalogue validation rejects duplicate source IDs without config', () => {
  const invalidCatalogue = structuredClone(catalogue);
  invalidCatalogue.products[0].printful_sync_product_ids = [1, 1];
  assert.throws(
    () => validateCommercialCatalogue(invalidCatalogue),
    /products\[0\]\.printful_sync_product_ids must contain one or two unique IDs/,
  );
});

test('commercial catalogue validation rejects inactive variants without config', () => {
  const invalidCatalogue = structuredClone(catalogue);
  invalidCatalogue.products[0].variants[0].active = false;
  assert.throws(
    () => validateCommercialCatalogue(invalidCatalogue),
    /products\[0\]\.variants\[0\]\.active must be true/,
  );
});

test('commercial catalogue validation rejects inactive variants and option drift', () => {
  const inactiveCatalogue = structuredClone(catalogue);
  inactiveCatalogue.products[0].variants[0].active = false;
  assert.throws(
    () => validateCommercialCatalogue(inactiveCatalogue, config),
    /products\[0\]\.variants\[0\]\.active must be true/,
  );

  const driftedCatalogue = structuredClone(catalogue);
  driftedCatalogue.products[0].variants[0].size = '3XL';
  assert.throws(
    () => validateCommercialCatalogue(driftedCatalogue, config),
    /catalogue option set does not match commercial configuration/,
  );
});

test('failed commercial validation leaves the last-good catalogue byte-identical', async (t) => {
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'vertiflow-catalogue-'));
  const outputPath = path.join(temporaryDirectory, 'products.json');
  t.after(() => fs.rm(temporaryDirectory, { recursive: true, force: true }));
  const lastGoodBytes = Buffer.from('last-good-catalogue\n');
  await fs.writeFile(outputPath, lastGoodBytes);
  const invalidCatalogue = structuredClone(catalogue);
  invalidCatalogue.products[0].variants[0].size = '3XL';

  await assert.rejects(
    () => writeValidatedCatalogueAtomically(outputPath, invalidCatalogue, config),
    /catalogue option set does not match commercial configuration/,
  );
  assert.deepEqual(await fs.readFile(outputPath), lastGoodBytes);
});

test('catalogue preserves reviewed Printful color provenance and one-size aliases', () => {
  const performance = catalogue.products.find(({ slug }) => slug === 'shorts-performance-vf');
  const cases = catalogue.products.find(({ slug }) => slug === 'coque-iphone-vf');
  const neck = catalogue.products.find(({ slug }) => slug === 'cache-cou-vf');
  const bob = catalogue.products.find(({ slug }) => slug === 'bob-vf');
  assert.deepEqual([...new Set(performance.variants.map(({ printful_color }) => printful_color))], ['White']);
  assert.deepEqual([...new Set(cases.variants.map(({ printful_color }) => printful_color))], ['Glossy']);
  assert.deepEqual(neck.variants.map(({ size, printful_size }) => [size, printful_size]), [['M', 'One size']]);
  assert.deepEqual(bob.variants.map(({ size, printful_size }) => [size, printful_size]), [['M', 'One size']]);
});

test('buildCommercialCatalogue fails when an allowlisted source is missing', () => {
  const summaries = config.products
    .flatMap((product) => product.sources)
    .filter((source) => source.printful_sync_product_id !== 385122974)
    .map((source) => ({ id: source.printful_sync_product_id }));
  assert.throws(
    () => validateAllowlistedProducts(config, summaries),
    /Missing allowlisted Printful product 385122974/,
  );
});
