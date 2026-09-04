const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const COMMERCE_ENVIRONMENT = [
  'EMAILJS_CUSTOMER_TEMPLATE_ID',
  'EMAILJS_OWNER_TEMPLATE_ID',
  'EMAILJS_PRIVATE_KEY',
  'EMAILJS_PUBLIC_KEY',
  'EMAILJS_SERVICE_ID',
  'PRINTFUL_API_KEY',
  'PRINTFUL_STORE_ID',
  'PRINTFUL_TOKEN',
  'SITE_URL',
  'STRIPE_PROMOTION_CODE_ID',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_SHIPPING_RATE_ID',
  'STRIPE_WEBHOOK_SECRET',
  'VERTIFLOW_PROMO_CODE',
  'VERTIFLOW_TEST_ACCESS_TOKEN',
].sort();

const APPROVED_SYNC_PRODUCT_IDS = [
  376170525, 376418591, 376418706, 376418808, 376418868,
  376418913, 377330919, 377337480, 377338525, 377338630,
  377417508, 385121662, 385122205, 385122974, 385123410,
];

function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function collectJavaScriptFiles(directory) {
  return fs.readdirSync(path.join(ROOT, directory), { withFileTypes: true })
    .flatMap((entry) => {
      const relativePath = path.join(directory, entry.name);
      if (entry.isDirectory()) return collectJavaScriptFiles(relativePath);
      return entry.name.endsWith('.js') ? [relativePath] : [];
    });
}

function collectTypeScriptFiles(directory) {
  const absolute = path.join(ROOT, directory);
  if (!fs.existsSync(absolute)) return [];
  return fs.readdirSync(absolute, { withFileTypes: true })
    .flatMap((entry) => {
      const relativePath = path.join(directory, entry.name);
      if (entry.isDirectory()) return collectTypeScriptFiles(relativePath);
      return /\.tsx?$/.test(entry.name) ? [relativePath] : [];
    });
}

function extractCommerceEnvironmentReads(source) {
  let codeOnly = '';
  let state = 'code';
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];
    if (state === 'code') {
      if (character === '/' && next === '/') {
        state = 'line-comment';
        codeOnly += '  ';
        index += 1;
      } else if (character === '/' && next === '*') {
        state = 'block-comment';
        codeOnly += '  ';
        index += 1;
      } else if (character === "'" || character === '"' || character === '`') {
        state = character;
        codeOnly += ' ';
      } else {
        codeOnly += character;
      }
    } else if (state === 'line-comment') {
      if (character === '\n') {
        state = 'code';
        codeOnly += '\n';
      } else {
        codeOnly += ' ';
      }
    } else if (state === 'block-comment') {
      if (character === '*' && next === '/') {
        state = 'code';
        codeOnly += '  ';
        index += 1;
      } else {
        codeOnly += character === '\n' ? '\n' : ' ';
      }
    } else if (character === '\\') {
      codeOnly += '  ';
      index += 1;
    } else if (character === state) {
      state = 'code';
      codeOnly += ' ';
    } else {
      codeOnly += character === '\n' ? '\n' : ' ';
    }
  }
  const directAccesses = [...codeOnly.matchAll(
    /\b(?:process\.env|environment)(?:\?\.|\.)((?:(?:PRINTFUL|STRIPE|EMAILJS|VERTIFLOW)_[A-Z0-9_]+)|SITE_URL)\b/g,
  )]
    .map((match) => match[1]);
  return [...new Set(directAccesses)].sort();
}

test('environment discovery includes only actual commerce reads', () => {
  const source = `
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const siteUrl = environment?.SITE_URL;
    const nodeMode = process.env.NODE_ENV;
    // process.env.PRINTFUL_TOKEN is documentation, not a read.
    throw new Error('EMAILJS_PRIVATE_KEY is required');
  `;
  assert.deepEqual(extractCommerceEnvironmentReads(source), [
    'SITE_URL',
    'STRIPE_SECRET_KEY',
  ]);
});

test('documents every commerce environment variable consumed by runtime code with empty values', () => {
  const accessed = [
    ...collectJavaScriptFiles('functions'),
    ...collectJavaScriptFiles('scripts'),
    ...collectTypeScriptFiles('src'),
  ].flatMap((file) => extractCommerceEnvironmentReads(readProjectFile(file)));
  assert.deepEqual([...new Set(accessed)].sort(), COMMERCE_ENVIRONMENT);

  const entries = readProjectFile('.env.example')
    .split(/\r?\n/)
    .filter((line) => /^[A-Z][A-Z0-9_]*=/.test(line));
  assert.deepEqual(entries.map((line) => line.slice(0, -1)).sort(), COMMERCE_ENVIRONMENT);
  assert.ok(entries.every((line) => line.endsWith('=')), 'example values must remain empty');
  assert.doesNotMatch(readProjectFile('.env.example'), /(?:sk|rk|pk|whsec)_(?:live|test)_[A-Za-z0-9]+|re_[A-Za-z0-9]+/);
});

test('builds Next.js on Netlify and reaches the catalogue through the server-only barrel', () => {
  const netlify = readProjectFile('netlify.toml');
  assert.match(netlify, /\[build\][\s\S]*publish = "\.next"/);
  assert.match(netlify, /\[\[plugins\]\]\s*package = "@netlify\/plugin-nextjs"/);
  assert.match(netlify, /\[\[headers\]\]/);
  assert.doesNotMatch(netlify, /publish = "public"/);

  const barrel = readProjectFile('src/lib/commerce.server.ts');
  assert.match(barrel, /^import 'server-only'/m);
  assert.match(barrel, /import catalogueData from '\.\.\/\.\.\/data\/products\.json'/);
});

test('pins supported Node runtimes in package and Netlify configuration', () => {
  const packageJson = JSON.parse(readProjectFile('package.json'));
  const packageLock = JSON.parse(readProjectFile('package-lock.json'));
  const netlify = readProjectFile('netlify.toml');
  assert.equal(packageJson.engines?.node, '>=20');
  assert.equal(packageLock.packages?.['']?.engines?.node, '>=20');
  assert.match(netlify, /\[build\.environment\]\s*NODE_VERSION = "22"/);
});

test('keeps local Netlify CLI link state out of version control', () => {
  assert.match(readProjectFile('.gitignore'), /^\.netlify\/$/m);
});

test('committed catalogue is the reviewed nine-product, 107-variant Printful provenance set', () => {
  const catalogue = JSON.parse(readProjectFile('data/products.json'));
  assert.equal(catalogue.schema_version, 2);
  assert.equal(catalogue.currency, 'EUR');
  assert.equal(catalogue.products.length, 9);
  const variants = catalogue.products.flatMap((product) => product.variants);
  assert.equal(variants.filter((variant) => variant.active).length, 107);
  assert.deepEqual(
    [...new Set(variants.map((variant) => variant.printful_sync_product_id))].sort((a, b) => a - b),
    APPROVED_SYNC_PRODUCT_IDS,
  );
  assert.ok(variants.every((variant) => Number.isInteger(variant.printful_sync_variant_id) && variant.stripe_price_id));
});

test('browser checkout has no authority over provider keys, amounts, fulfillment, legacy payment, or email delivery', () => {
  const clientComponents = collectTypeScriptFiles('src')
    .map((file) => readProjectFile(file))
    .filter((source) => /^\s*['"]use client['"]/m.test(source));
  const browser = [
    readProjectFile('public/js/custom.js'),
    ...clientComponents,
  ].join('\n');
  assert.doesNotMatch(browser, /(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]+|whsec_[A-Za-z0-9]+/);
  assert.doesNotMatch(browser, /create-payment-intent|paymentIntents\.create|amount\s*:/i);
  assert.doesNotMatch(browser, /printful(?:_sync)?_variant_id|api\.emailjs\.com|@emailjs\/browser/i);
});

test('commerce runbook retains the controlled promotion and recovery gates', () => {
  const runbook = readProjectFile('docs/commerce-catalogue.md');
  for (const requiredText of [
    '107',
    'test-mode',
    'PRINTFUL_STORE_ID',
    'EMAILJS_CUSTOMER_TEMPLATE_ID',
    'EMAILJS_OWNER_TEMPLATE_ID',
    'deterministic',
    'confirm: false',
    'at-least-once',
    'Replay and failure matrix',
    'Rollback',
    'explicit approval',
    'VERTIFLOW_TEST_ACCESS_TOKEN',
  ]) {
    assert.match(runbook, new RegExp(requiredText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }
});
