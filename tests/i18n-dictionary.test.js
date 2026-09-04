const test = require('node:test');
const assert = require('node:assert/strict');
const { dictionaries } = require('../src/lib/i18n/dictionary.ts');
const { productCopyEn } = require('../src/lib/i18n/product-copy-en.ts');
const { productCopy } = require('../src/lib/product-copy.ts');
const catalogue = require('../data/products.json');

function assertParity(a, b, path) {
  assert.equal(typeof a, typeof b, `${path}: type mismatch between locales`);

  if (Array.isArray(a)) {
    assert.ok(Array.isArray(b), `${path}: expected an array in both locales`);
    assert.ok(a.length > 0 && b.length > 0, `${path}: array must not be empty in either locale`);
    assertParity(a[0], b[0], `${path}[]`);
    return;
  }

  if (a && typeof a === 'object') {
    const aKeys = Object.keys(a).sort();
    const bKeys = Object.keys(b).sort();
    assert.deepEqual(bKeys, aKeys, `${path}: key sets differ (fr=[${aKeys}], en=[${bKeys}])`);
    for (const key of aKeys) {
      assertParity(a[key], b[key], `${path}.${key}`);
    }
    return;
  }

  assert.equal(typeof a, 'string', `${path}: expected a string leaf`);
  assert.ok(a.trim().length > 0, `${path}: fr value is empty`);
  assert.ok(b.trim().length > 0, `${path}: en value is empty`);
}

test('every dictionary key exists in both fr and en, with non-empty values', () => {
  assertParity(dictionaries.fr, dictionaries.en, 'dictionary');
});

test('a missing or renamed dictionary namespace is caught even if a locale is added later', () => {
  assert.deepEqual(Object.keys(dictionaries).sort(), ['en', 'fr']);
});

test('every catalogue slug has an English product-copy entry', () => {
  for (const product of catalogue.products) {
    assert.ok(productCopyEn[product.slug], `${product.slug} has no English product-copy entry`);
  }
});

test('English product copy has the same key shape as the French original for every slug', () => {
  for (const slug of Object.keys(productCopy)) {
    assert.ok(productCopyEn[slug], `${slug} is missing from productCopyEn`);
    assertParity(productCopy[slug], productCopyEn[slug], `productCopy.${slug}`);
  }
});

test('English product copy has the same number of spec rows as the French original', () => {
  for (const slug of Object.keys(productCopy)) {
    assert.equal(
      productCopyEn[slug].specs.length,
      productCopy[slug].specs.length,
      `${slug}: spec row count differs between fr and en`,
    );
  }
});
