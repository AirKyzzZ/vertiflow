const test = require('node:test');
const assert = require('node:assert/strict');
const {
  readCart,
  addLine,
  setQuantity,
  removeLine,
  countLines,
  canDecreaseQuantity,
  canIncreaseQuantity,
} = require('../src/lib/cart.ts');

test('legacy cart items keyed by id migrate to slug and drop cached fields', () => {
  const legacy = JSON.stringify([
    { id: 'tshirt-climb', displayPrice: '29.99', size: 'M', color: 'Noir', quantity: 2, image: 'https://x/y.png' },
  ]);
  assert.deepEqual(readCart(legacy), [
    { slug: 'tshirt-climb', color: 'Noir', size: 'M', quantity: 2 },
  ]);
});

test('malformed storage resets to an empty cart instead of throwing', () => {
  assert.deepEqual(readCart('not json'), []);
  assert.deepEqual(readCart(null), []);
  assert.deepEqual(readCart('{"not":"an array"}'), []);
});

test('lines with an unusable quantity are dropped', () => {
  const raw = JSON.stringify([
    { slug: 'bob-vf', color: 'Noir', size: 'Unique', quantity: 0 },
    { slug: 'bob-vf', color: 'Noir', size: 'Unique', quantity: 3 },
  ]);
  assert.deepEqual(readCart(raw), [{ slug: 'bob-vf', color: 'Noir', size: 'Unique', quantity: 3 }]);
});

test('adding a duplicate variant merges quantity and caps at ten', () => {
  const lines = [{ slug: 'bob-vf', color: 'Noir', size: 'Unique', quantity: 8 }];
  const merged = addLine(lines, { slug: 'bob-vf', color: 'Noir', size: 'Unique', quantity: 5 });
  assert.equal(merged.length, 1);
  assert.equal(merged[0].quantity, 10);
});

test('adding a different variant of the same product appends a line', () => {
  const lines = [{ slug: 'tshirt-climb', color: 'Noir', size: 'M', quantity: 1 }];
  const next = addLine(lines, { slug: 'tshirt-climb', color: 'Noir', size: 'L', quantity: 1 });
  assert.equal(next.length, 2);
});

test('setQuantity clamps to the one-to-ten server bound', () => {
  const lines = [{ slug: 'bob-vf', color: 'Noir', size: 'Unique', quantity: 3 }];
  assert.equal(setQuantity(lines, 0, 99)[0].quantity, 10);
  assert.equal(setQuantity(lines, 0, 0)[0].quantity, 1);
});

test('removeLine drops only the targeted index', () => {
  const lines = [
    { slug: 'bob-vf', color: 'Noir', size: 'Unique', quantity: 1 },
    { slug: 'casquette-vf', color: 'Noir', size: 'Unique', quantity: 1 },
  ];
  assert.deepEqual(removeLine(lines, 0), [{ slug: 'casquette-vf', color: 'Noir', size: 'Unique', quantity: 1 }]);
});

test('canDecreaseQuantity is false at the floor and true above it', () => {
  assert.equal(canDecreaseQuantity(1), false);
  assert.equal(canDecreaseQuantity(2), true);
});

test('canIncreaseQuantity is false at the ten-unit ceiling and true below it', () => {
  assert.equal(canIncreaseQuantity(10), false);
  assert.equal(canIncreaseQuantity(9), true);
});

test('canDecreaseQuantity and canIncreaseQuantity ignore out-of-range input rather than throwing', () => {
  assert.equal(canDecreaseQuantity(0), false);
  assert.equal(canIncreaseQuantity(11), false);
});

test('countLines is zero for an empty cart, the drawer\'s empty-state condition', () => {
  assert.equal(countLines([]), 0);
});

test('countLines sums quantities, not line count, once the cart has items', () => {
  const lines = [
    { slug: 'bob-vf', color: 'Blanc', size: 'Unique', quantity: 2 },
    { slug: 'casquette-vf', color: 'Noir', size: 'Unique', quantity: 3 },
  ];
  assert.equal(countLines(lines), 5);
});
