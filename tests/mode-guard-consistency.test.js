const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');

function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function stripWhitespace(source) {
  return source.replace(/\s+/g, '');
}

function hasStrippedSubstring(source, needle) {
  return stripWhitespace(source).includes(stripWhitespace(needle));
}

const GATES = [
  {
    file: 'functions/create-checkout-session.js',
    detect: (source) => hasStrippedSubstring(
      source,
      "if (secretMode !== 'test') throw new Error('Live Stripe keys require a live catalogue');",
    ),
  },
  {
    file: 'functions/get-checkout-session.js',
    detect: (source) => hasStrippedSubstring(
      source,
      "if (!/^(?:sk|rk)_test_[A-Za-z0-9_]+$/.test(environment?.STRIPE_SECRET_KEY || '')) {",
    ),
  },
  {
    file: 'functions/stripe-webhook.js',
    label: 'functions/stripe-webhook.js (validateWebhookEnvironment)',
    detect: (source) => hasStrippedSubstring(
      source,
      "if (!/^(?:sk|rk)_test_[A-Za-z0-9]+$/.test(environment.STRIPE_SECRET_KEY)) {",
    ),
  },
  {
    file: 'functions/stripe-webhook.js',
    label: 'functions/stripe-webhook.js (paid-session fulfilment gate)',
    detect: (source) => hasStrippedSubstring(source, 'if (context.session.livemode !== false) {'),
  },
  {
    file: 'scripts/sync-stripe-prices.js',
    detect: (source) => hasStrippedSubstring(
      source,
      "if (!secretKey.startsWith('sk_test_') && !secretKey.startsWith('rk_test_')) {",
    ),
  },
];

test('all five Stripe mode gates enforce test-only in lockstep', () => {
  const results = GATES.map((gate) => ({
    label: gate.label ?? gate.file,
    active: gate.detect(readProjectFile(gate.file)),
  }));

  for (const result of results) {
    assert.equal(
      typeof result.active,
      'boolean',
      `${result.label}: detector did not produce a boolean result`,
    );
  }

  const allAgree = results.every((result) => result.active === results[0].active);
  const table = results
    .map((result) => `  ${result.active ? 'test-only' : 'LIFTED TO LIVE'}  ${result.label}`)
    .join('\n');

  assert.ok(
    allAgree,
    'Stripe mode gates are out of step. They must be lifted together, never one at a time, '
      + `or a paid order can be charged and never fulfilled:\n${table}`,
  );
});
