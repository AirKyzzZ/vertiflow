#!/usr/bin/env node

require('dotenv').config();

const fs = require('node:fs/promises');
const path = require('node:path');
const Stripe = require('stripe');
const { readTestId, reconcileCatalogue } = require('./lib/stripe-catalogue');

const CATALOGUE_PATH = path.resolve(__dirname, '../data/products.json');

function assertSafeStripeKey(secretKey) {
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is required');
  }

  if (!secretKey.startsWith('sk_test_') && !secretKey.startsWith('rk_test_')) {
    throw new Error('Stripe price reconciliation requires a test-mode Stripe secret key');
  }
}

async function writeJsonAtomically(filePath, value) {
  const temporaryPath = `${filePath}.tmp`;
  await fs.writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await fs.rename(temporaryPath, filePath);
}

function countActiveReconciledVariants(catalogue) {
  return catalogue.products.reduce(
    (total, product) => total + product.variants.filter(
      (variant) => variant.active && readTestId(variant.stripe_price_id),
    ).length,
    0,
  );
}

async function main() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  assertSafeStripeKey(secretKey);

  const catalogue = JSON.parse(await fs.readFile(CATALOGUE_PATH, 'utf8'));
  const stripe = new Stripe(secretKey);
  const reconciledCatalogue = await reconcileCatalogue(stripe, catalogue);

  await writeJsonAtomically(CATALOGUE_PATH, reconciledCatalogue);

  const priceCount = countActiveReconciledVariants(reconciledCatalogue);
  process.stdout.write(
    `Reconciled ${reconciledCatalogue.products.length} products and ${priceCount} Stripe prices\n`,
  );
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { assertSafeStripeKey, countActiveReconciledVariants };
