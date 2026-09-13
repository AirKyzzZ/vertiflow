const test = require('node:test');
const assert = require('node:assert/strict');
const { productCopy } = require('../src/lib/product-copy.ts');
const catalogue = require('../data/products.json');

test('every catalogue slug has a product-copy.ts entry', () => {
  for (const product of catalogue.products) {
    assert.ok(productCopy[product.slug], `${product.slug} has no product-copy.ts entry`);
  }
});
