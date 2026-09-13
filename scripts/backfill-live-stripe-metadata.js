#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { productMetadata, priceMetadata } = require('./lib/stripe-catalogue');

const CATALOGUE_PATH = path.resolve(__dirname, '../data/products.json');
const APPLY = process.argv.includes('--apply');

function stripe(args) {
  return JSON.parse(execFileSync('stripe', args, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 32 }));
}

function metadataArgs(metadata) {
  return Object.entries(metadata).flatMap(([key, value]) => ['-d', `metadata[${key}]=${value}`]);
}

function missingKeys(current, wanted) {
  return Object.entries(wanted)
    .filter(([key, value]) => current?.[key] !== value)
    .map(([key]) => key);
}

function main() {
  const catalogue = JSON.parse(fs.readFileSync(CATALOGUE_PATH, 'utf8'));
  let productsPatched = 0;
  let pricesPatched = 0;
  let alreadyCorrect = 0;

  for (const product of catalogue.products) {
    const productId = product.stripe_product_id?.live;
    if (!productId) throw new Error(`${product.slug} has no live Stripe product id`);

    const wantedProduct = productMetadata(product);
    const liveProduct = stripe(['products', 'retrieve', productId, '--live']);
    const productGaps = missingKeys(liveProduct.metadata, wantedProduct);

    if (productGaps.length === 0) {
      alreadyCorrect += 1;
    } else {
      process.stdout.write(`${APPLY ? 'patch' : 'would patch'} product ${productId} ${product.slug}: ${productGaps.join(', ')}\n`);
      if (APPLY) stripe(['products', 'update', productId, '--live', '--confirm', ...metadataArgs(wantedProduct)]);
      productsPatched += 1;
    }

    for (const variant of product.variants) {
      const priceId = variant.stripe_price_id?.live;
      if (!priceId) throw new Error(`${product.slug} ${variant.color}/${variant.size} has no live Stripe price id`);

      const wantedPrice = priceMetadata(product, variant);
      const livePrice = stripe(['prices', 'retrieve', priceId, '--live']);
      const priceGaps = missingKeys(livePrice.metadata, wantedPrice);

      if (priceGaps.length === 0) {
        alreadyCorrect += 1;
        continue;
      }
      process.stdout.write(`${APPLY ? 'patch' : 'would patch'} price ${priceId} ${product.slug} ${variant.color}/${variant.size}: ${priceGaps.join(', ')}\n`);
      if (APPLY) stripe(['prices', 'update', priceId, '--live', '--confirm', ...metadataArgs(wantedPrice)]);
      pricesPatched += 1;
    }
  }

  process.stdout.write(
    `\n${APPLY ? 'Patched' : 'Would patch'} ${productsPatched} products and ${pricesPatched} prices. `
      + `${alreadyCorrect} already correct.\n`,
  );
  if (!APPLY) process.stdout.write('Dry run. Re-run with --apply to write to live Stripe.\n');
}

main();
