const test = require('node:test');
const assert = require('node:assert/strict');
const { groupByGeneration } = require('../src/lib/iphone-generation.ts');
const { swatchClass } = require('../src/lib/swatch.ts');
const catalogue = require('../data/products.json');

function iphoneModels() {
  const product = catalogue.products.find((entry) => entry.slug === 'coque-iphone-vf');
  return [...new Set(product.variants.filter((variant) => variant.active).map((variant) => variant.size))];
}

test('all 23 real iPhone models group into 6 generations with counts 3, 4, 4, 4, 4, 4', () => {
  const models = iphoneModels();
  assert.equal(models.length, 23);
  const groups = groupByGeneration(models);
  assert.equal(groups.length, 6);
  assert.deepEqual(groups.map(([, entries]) => entries.length), [3, 4, 4, 4, 4, 4]);
});

test('swatchClass returns distinct non-empty classes for Noir and Blanc', () => {
  const noir = swatchClass('Noir');
  const blanc = swatchClass('Blanc');
  assert.ok(noir.length > 0);
  assert.ok(blanc.length > 0);
  assert.notEqual(noir, blanc);
});

test('swatchClass does not throw for an unknown colour', () => {
  assert.doesNotThrow(() => swatchClass('Rouge'));
});
