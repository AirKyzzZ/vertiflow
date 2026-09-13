#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { productMetadata, priceMetadata } = require('./lib/stripe-catalogue');

const CATALOGUE_PATH = path.resolve(__dirname, '../data/products.json');
const WEBHOOK_URL = 'https://vertiflow.fr/api/stripe/webhook';
const REQUIRED_EVENTS = ['checkout.session.completed', 'checkout.session.async_payment_succeeded'];
const WEBHOOK_ENV = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SHIPPING_RATE_ID',
  'STRIPE_WEBHOOK_SECRET',
  'PRINTFUL_STORE_ID',
  'EMAILJS_SERVICE_ID',
  'EMAILJS_PUBLIC_KEY',
  'EMAILJS_PRIVATE_KEY',
  'EMAILJS_CUSTOMER_TEMPLATE_ID',
  'EMAILJS_OWNER_TEMPLATE_ID',
];

const results = [];
const record = (ok, label, detail) => results.push({ ok, label, detail });

function stripe(args) {
  return JSON.parse(execFileSync('stripe', args, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 32 }));
}

function netlifyProductionEnv() {
  const raw = execFileSync('npx', ['--no-install', 'netlify', 'env:list', '--context', 'production', '--json'], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 8,
  });
  return JSON.parse(raw.slice(raw.indexOf('{')));
}

function checkWebhookEndpoint() {
  const endpoints = stripe(['webhook_endpoints', 'list', '--live', '--limit', '30']).data;
  const ours = endpoints.find((endpoint) => endpoint.url === WEBHOOK_URL);
  if (!ours) return record(false, 'Live webhook endpoint', `no endpoint for ${WEBHOOK_URL}`);
  if (ours.status !== 'enabled') return record(false, 'Live webhook endpoint', `status is ${ours.status}`);
  const missing = REQUIRED_EVENTS.filter((event) => !ours.enabled_events.includes(event));
  record(missing.length === 0, 'Live webhook endpoint', missing.length ? `missing events: ${missing.join(', ')}` : 'enabled with both events');
}

function checkShippingRate(env) {
  const configured = env.STRIPE_SHIPPING_RATE_ID;
  if (!configured) return record(false, 'Live shipping rate', 'STRIPE_SHIPPING_RATE_ID missing in production');
  try {
    const rate = stripe(['shipping_rates', 'retrieve', configured, '--live']);
    const amount = rate.fixed_amount ? `${(rate.fixed_amount.amount / 100).toFixed(2)} ${rate.fixed_amount.currency}` : rate.type;
    record(rate.active === true, 'Live shipping rate', `${rate.id} ${rate.display_name} ${amount} active=${rate.active}`);
  } catch {
    record(false, 'Live shipping rate', `${configured} does not resolve in live mode`);
  }
}

function checkCatalogueMetadata() {
  const catalogue = JSON.parse(fs.readFileSync(CATALOGUE_PATH, 'utf8'));
  const gaps = [];
  for (const product of catalogue.products) {
    const live = stripe(['products', 'retrieve', product.stripe_product_id.live, '--live']);
    const wanted = productMetadata(product);
    if (Object.entries(wanted).some(([key, value]) => live.metadata?.[key] !== value)) gaps.push(`product ${product.slug}`);
    for (const variant of product.variants) {
      const price = stripe(['prices', 'retrieve', variant.stripe_price_id.live, '--live']);
      const wantedPrice = priceMetadata(product, variant);
      if (Object.entries(wantedPrice).some(([key, value]) => price.metadata?.[key] !== value)) {
        gaps.push(`price ${product.slug} ${variant.color}/${variant.size}`);
      }
    }
  }
  record(gaps.length === 0, 'Live Stripe metadata', gaps.length ? `${gaps.length} objects missing webhook metadata` : 'every product and price carries what the webhook checks');
}

function checkProductionEnv(env) {
  const missing = WEBHOOK_ENV.filter((name) => !(name in env));
  record(missing.length === 0, 'Production env vars', missing.length ? `missing: ${missing.join(', ')}` : 'all present');
  const sameTemplate = env.EMAILJS_CUSTOMER_TEMPLATE_ID && env.EMAILJS_CUSTOMER_TEMPLATE_ID === env.EMAILJS_OWNER_TEMPLATE_ID;
  record(!sameTemplate, 'EmailJS templates', sameTemplate ? 'customer and owner point at the same template' : 'two distinct templates');
}

function main() {
  const env = netlifyProductionEnv();
  checkWebhookEndpoint();
  checkShippingRate(env);
  checkProductionEnv(env);
  checkCatalogueMetadata();

  const width = Math.max(...results.map((r) => r.label.length));
  for (const { ok, label, detail } of results) {
    process.stdout.write(`${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(width)}  ${detail}\n`);
  }
  const failed = results.filter((r) => !r.ok).length;
  process.stdout.write(`\n${results.length - failed}/${results.length} checks passed.\n`);
  process.stdout.write('A real card purchase and refund is the only step this script cannot cover.\n');
  process.exitCode = failed ? 1 : 0;
}

main();
