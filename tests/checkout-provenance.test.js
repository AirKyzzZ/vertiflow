const assert = require('node:assert/strict');
const test = require('node:test');

const {
  checkoutDigest,
  checkoutMetadata,
  matchesCheckoutDigest,
} = require('../functions/lib/checkout-provenance');

function line(overrides = {}) {
  return {
    priceId: 'price_test_black_m',
    stripeProductId: 'prod_test_hoodie',
    currency: 'eur',
    unitAmount: 6499,
    slug: 'hoodie-vf-definition',
    syncProductId: 376418591,
    syncVariantId: 4739108644,
    catalogVariantId: 10780,
    quantity: 1,
    ...overrides,
  };
}

test('checkout digest is stable across Stripe line-item ordering', () => {
  const first = line();
  const second = line({
    priceId: 'price_test_white_l',
    syncProductId: 377337480,
    syncVariantId: 4748682990,
    catalogVariantId: 10787,
    quantity: 2,
  });

  assert.equal(checkoutDigest([first, second]), checkoutDigest([second, first]));
  assert.match(checkoutDigest([first]), /^[A-Za-z0-9_-]{43}$/);
});

test('checkout metadata records the version, digest, line count, and test mode', () => {
  const lines = [line()];
  assert.deepEqual(checkoutMetadata(lines, 'test'), {
    vf_checkout_version: '1',
    vf_checkout_sha256: checkoutDigest(lines),
    vf_line_count: '1',
    vf_livemode: 'test',
  });
  assert.equal(matchesCheckoutDigest(lines, checkoutDigest(lines)), true);
  assert.equal(matchesCheckoutDigest(lines, checkoutDigest([line({ quantity: 2 })])), false);
});

test('checkout provenance rejects duplicate fulfilment identities and invalid bounds', () => {
  const duplicatePrice = line({ syncVariantId: 2, catalogVariantId: 3 });
  const duplicateVariant = line({ priceId: 'price_other' });
  assert.throws(() => checkoutDigest([line(), duplicatePrice]), /duplicate Price/i);
  assert.throws(() => checkoutDigest([line(), duplicateVariant]), /duplicate Printful sync variant/i);

  for (const invalid of [
    [],
    Array.from({ length: 101 }, (_, index) => line({ priceId: `price_${index}`, syncVariantId: index + 1 })),
    [line({ unitAmount: 0 })],
    [line({ quantity: 0 })],
    [line({ quantity: 11 })],
    [line({ quantity: 1.5 })],
    [line({ currency: 'EURO' })],
    [line({ slug: '' })],
    [line({ syncProductId: -1 })],
    [line({ catalogVariantId: 0 })],
  ]) {
    assert.throws(() => checkoutDigest(invalid), /checkout provenance/i);
  }
});

test('digest comparison rejects malformed attacker-controlled values without throwing', () => {
  const lines = [line()];
  for (const digest of [undefined, '', 'not-base64url', 'a'.repeat(500)]) {
    assert.equal(matchesCheckoutDigest(lines, digest), false);
  }
});

// This integrity tag detects accidental or out-of-band mutation after Checkout
// creation. Stripe account writers can replace both line facts and metadata and
// are therefore explicitly trusted by this design.
