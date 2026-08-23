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

const PAYMENT_PATH_GATES = [
  {
    file: 'functions/create-checkout-session.js',
    detect: (source) => !hasStrippedSubstring(
      source,
      "if (secretMode !== 'test') throw new Error('Live Stripe keys require a live catalogue');",
    ),
  },
  {
    file: 'functions/get-checkout-session.js',
    detect: (source) => hasStrippedSubstring(
      source,
      "if (!/^(?:sk|rk)_(?:test|live)_[A-Za-z0-9_]+$/.test(environment?.STRIPE_SECRET_KEY || '')) {",
    ),
  },
  {
    file: 'functions/stripe-webhook.js',
    label: 'functions/stripe-webhook.js (validateWebhookEnvironment)',
    detect: (source) => hasStrippedSubstring(
      source,
      "if (!/^(?:sk|rk)_(?:test|live)_[A-Za-z0-9]+$/.test(environment.STRIPE_SECRET_KEY)) {",
    ),
  },
  {
    file: 'functions/stripe-webhook.js',
    label: 'functions/stripe-webhook.js (paid-session fulfilment gate)',
    detect: (source) => hasStrippedSubstring(
      source,
      "if (context.session.livemode !== (context.session.metadata?.vf_livemode === 'live')) {",
    ),
  },
];

test('the four live-checkout mode gates move together, in lockstep', () => {
  const results = PAYMENT_PATH_GATES.map((gate) => ({
    label: gate.label ?? gate.file,
    liveEnabled: gate.detect(readProjectFile(gate.file)),
  }));

  for (const result of results) {
    assert.equal(
      typeof result.liveEnabled,
      'boolean',
      `${result.label}: detector did not produce a boolean result`,
    );
  }

  const allAgree = results.every((result) => result.liveEnabled === results[0].liveEnabled);
  const table = results
    .map((result) => `  ${result.liveEnabled ? 'live-enabled' : 'test-only'}  ${result.label}`)
    .join('\n');

  assert.ok(
    allAgree,
    'Stripe mode gates are out of step. They must be lifted (or rolled back) together, never one at '
      + `a time, or a paid order can be charged and never fulfilled:\n${table}`,
  );
});

test('checkout session creation, retrieval, and the webhook are all currently live-enabled', () => {
  const results = PAYMENT_PATH_GATES.map((gate) => gate.detect(readProjectFile(gate.file)));
  assert.ok(
    results.every(Boolean),
    'Expected all four payment-path mode gates to accept live Stripe keys on this branch.',
  );
});

test('the offline Stripe catalogue reconciliation script stays permanently test-only', () => {
  const source = readProjectFile('scripts/sync-stripe-prices.js');
  assert.ok(
    hasStrippedSubstring(
      source,
      "if (!secretKey.startsWith('sk_test_') && !secretKey.startsWith('rk_test_')) {",
    ),
    'scripts/sync-stripe-prices.js must keep refusing live Stripe secret keys. It writes catalogue '
      + 'IDs non-interactively from a local .env file and never serves a request, so it is not part '
      + 'of the payment/fulfilment lockstep above: live Products and Prices are only ever created '
      + 'deliberately through the CLI process in Part 2.',
  );
});
