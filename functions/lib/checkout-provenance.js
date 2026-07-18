const crypto = require('node:crypto');

const CHECKOUT_VERSION = '1';
const MAX_LINES = 100;

class CheckoutProvenanceError extends Error {}

function invalid() {
  throw new CheckoutProvenanceError('Invalid checkout provenance');
}

function boundedIdentifier(value, pattern) {
  if (typeof value !== 'string' || value.length > 500 || !pattern.test(value)) invalid();
  return value;
}

function positiveInteger(value) {
  if (!Number.isSafeInteger(value) || value <= 0) invalid();
  return value;
}

function checkoutTuples(lines) {
  if (!Array.isArray(lines) || lines.length < 1 || lines.length > MAX_LINES) invalid();

  const priceIds = new Set();
  const syncVariantIds = new Set();
  const tuples = lines.map((line) => {
    if (!line || typeof line !== 'object' || Array.isArray(line)) invalid();
    const priceId = boundedIdentifier(line.priceId, /^price_[A-Za-z0-9_]+$/);
    const stripeProductId = boundedIdentifier(line.stripeProductId, /^prod_[A-Za-z0-9_]+$/);
    const currency = boundedIdentifier(line.currency, /^[a-z]{3}$/);
    const unitAmount = positiveInteger(line.unitAmount);
    const slug = boundedIdentifier(line.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    const syncProductId = positiveInteger(line.syncProductId);
    const syncVariantId = positiveInteger(line.syncVariantId);
    const catalogVariantId = positiveInteger(line.catalogVariantId);
    const quantity = positiveInteger(line.quantity);
    if (quantity > 10) invalid();
    if (priceIds.has(priceId)) throw new CheckoutProvenanceError('Duplicate Price in checkout provenance');
    if (syncVariantIds.has(syncVariantId)) {
      throw new CheckoutProvenanceError('Duplicate Printful sync variant in checkout provenance');
    }
    priceIds.add(priceId);
    syncVariantIds.add(syncVariantId);
    return [
      priceId,
      stripeProductId,
      currency,
      unitAmount,
      slug,
      syncProductId,
      syncVariantId,
      catalogVariantId,
      quantity,
    ];
  });

  return tuples.sort((left, right) => {
    const leftValue = JSON.stringify(left);
    const rightValue = JSON.stringify(right);
    if (leftValue < rightValue) return -1;
    if (leftValue > rightValue) return 1;
    return 0;
  });
}

function checkoutDigest(lines) {
  return crypto.createHash('sha256')
    .update(JSON.stringify(checkoutTuples(lines)), 'utf8')
    .digest('base64url');
}

function matchesCheckoutDigest(lines, expectedDigest) {
  if (typeof expectedDigest !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(expectedDigest)) return false;
  try {
    const actual = Buffer.from(checkoutDigest(lines), 'ascii');
    const expected = Buffer.from(expectedDigest, 'ascii');
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function testAccessDigest(token) {
  if (typeof token !== 'string' || token.length < 32 || token.length > 200 || token.trim() !== token) invalid();
  return crypto.createHash('sha256').update(token, 'utf8').digest('base64url');
}

function matchesTestAccess(value, expectedDigest) {
  if (typeof expectedDigest !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(expectedDigest)) return false;
  try {
    const actual = Buffer.from(testAccessDigest(value), 'ascii');
    const expected = Buffer.from(expectedDigest, 'ascii');
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function checkoutMetadata(lines, mode) {
  if (!['test', 'live'].includes(mode)) invalid();
  return {
    vf_checkout_version: CHECKOUT_VERSION,
    vf_checkout_sha256: checkoutDigest(lines),
    vf_line_count: String(lines.length),
    vf_livemode: mode,
  };
}

// This tag protects the delayed-payment handoff from accidental or out-of-band
// mutation. Stripe account writers can replace both the facts and this tag, so
// they remain trusted administrators rather than cryptographic adversaries.

module.exports = {
  CHECKOUT_VERSION,
  CheckoutProvenanceError,
  checkoutDigest,
  checkoutMetadata,
  checkoutTuples,
  matchesCheckoutDigest,
  matchesTestAccess,
  testAccessDigest,
};
