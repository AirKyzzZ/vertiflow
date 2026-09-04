#!/usr/bin/env node

require('dotenv').config();

const fs = require('node:fs/promises');
const path = require('node:path');
const readline = require('node:readline/promises');
const { execFileSync } = require('node:child_process');

const {
  PrintfulClient,
  buildCommercialCatalogue,
  resolvePrintfulApiKey,
  validatePrintfulStoreId,
} = require('./lib/printful-catalogue');
const { loadProductsSchema, validateProductsCatalogue } = require('./lib/products-schema');
const { reviewedUnitAmount } = require('../functions/lib/catalogue');

const CATALOGUE_PATH = path.resolve(__dirname, '../data/products.json');
const PRODUCT_COPY_PATH = 'src/lib/product-copy.ts';
const PRODUCT_MEDIA_PATH = 'src/lib/product-media.ts';
const BANNED_NAME_PATTERN = /pkba|kenzi/i;

function parseSizes(raw) {
  const sizes = raw.split(',').map((size) => size.trim()).filter(Boolean);
  if (sizes.length === 0) throw new Error('At least one size is required');
  if (new Set(sizes).size !== sizes.length) throw new Error('Sizes must be unique');
  return sizes;
}

function parseSizeAliases(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const size_aliases = {};
  for (const pair of trimmed.split(',')) {
    const [printfulSize, publicSize] = pair.split('=').map((part) => part.trim());
    if (!printfulSize || !publicSize) {
      throw new Error(`Invalid size alias "${pair.trim()}"; expected PRINTFUL_SIZE=PUBLIC_SIZE`);
    }
    size_aliases[printfulSize] = publicSize;
  }
  return size_aliases;
}

function assertSlugAvailable(catalogue, slug, slugPattern) {
  if (!slugPattern.test(slug)) {
    throw new Error(`"${slug}" is not a URL-safe slug (lowercase letters, digits, single hyphens)`);
  }
  if (catalogue.products.some((product) => product.slug === slug)) {
    throw new Error(`Product "${slug}" already exists in data/products.json — refusing to run`);
  }
}

function assertValidPrice(price, pricePattern) {
  if (!pricePattern.test(price)) {
    throw new Error(`"${price}" must look like 29.99 (a decimal with exactly two digits)`);
  }
}

function assertNotBannedName(name, context) {
  if (BANNED_NAME_PATTERN.test(name)) {
    throw new Error(
      `${context} name "${name}" matches a product family that must stay out of VertiFlow's `
        + 'catalogue (PKBA/Kenzi). Refusing to continue.',
    );
  }
}

async function writeJsonAtomically(filePath, value) {
  const temporaryPath = `${filePath}.tmp`;
  await fs.writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await fs.rename(temporaryPath, filePath);
}

function defaultStripeRunner(args) {
  return execFileSync('stripe', args, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 32 });
}

function stripeCli(runner, args) {
  return JSON.parse(runner(args));
}

function modeFlag(mode) {
  return mode === 'live' ? ['--live'] : [];
}

function findExistingStripeProduct(runner, mode, slug) {
  const result = stripeCli(runner, ['products', 'list', ...modeFlag(mode), '--limit', '100']);
  if (result.has_more) {
    throw new Error(`More than 100 ${mode}-mode Stripe products exist; pagination not implemented`);
  }
  return result.data.find((product) => product.metadata?.vf_slug === slug);
}

function ensureStripeProduct(runner, mode, product) {
  const existing = findExistingStripeProduct(runner, mode, product.slug);
  if (existing) return existing;
  return stripeCli(runner, [
    'products', 'create', ...modeFlag(mode), '--confirm',
    '-i', `vf_${mode}_product_${product.slug}`,
    '--name', product.name,
    '--shippable=true',
    '-d', `metadata[vf_slug]=${product.slug}`,
  ]);
}

function listAllStripePrices(runner, mode, stripeProductId) {
  const result = stripeCli(runner, [
    'prices', 'list', ...modeFlag(mode), '--product', stripeProductId, '--limit', '100',
  ]);
  if (result.has_more) {
    throw new Error(`Stripe product ${stripeProductId} has more than 100 ${mode}-mode prices; pagination not implemented`);
  }
  return result.data;
}

function ensureStripePrice(runner, mode, product, variant, stripeProductId, currency) {
  const unitAmount = reviewedUnitAmount(product.price);
  const existingPrices = listAllStripePrices(runner, mode, stripeProductId);
  const existing = existingPrices.find((price) => price.metadata?.vf_slug === product.slug
    && price.metadata?.vf_color === variant.color
    && price.metadata?.vf_size === variant.size);
  if (existing) return existing;
  return stripeCli(runner, [
    'prices', 'create', ...modeFlag(mode), '-c',
    '-i', `vf_${mode}_price_${product.slug}_${variant.printful_sync_variant_id}`,
    '--currency', currency.toLowerCase(),
    '--unit-amount', String(unitAmount),
    '--product', stripeProductId,
    '-d', `metadata[vf_slug]=${product.slug}`,
    '-d', `metadata[vf_color]=${variant.color}`,
    '-d', `metadata[vf_size]=${variant.size}`,
  ]);
}

function createStripeObjectsForMode(runner, mode, product, currency) {
  const stripeProduct = ensureStripeProduct(runner, mode, product);
  const priceIdByVariant = new Map();
  for (const variant of product.variants) {
    const price = ensureStripePrice(runner, mode, product, variant, stripeProduct.id, currency);
    priceIdByVariant.set(variant, price.id);
  }
  return { productId: stripeProduct.id, priceIdByVariant };
}

function attachStripeIds(product, currency, {
  testRunner = defaultStripeRunner,
  liveRunner = defaultStripeRunner,
  onLiveError,
} = {}) {
  const testResult = createStripeObjectsForMode(testRunner, 'test', product, currency);
  product.stripe_product_id = { test: testResult.productId, live: null };
  product.variants.forEach((variant) => {
    variant.stripe_price_id = { test: testResult.priceIdByVariant.get(variant) ?? null, live: null };
  });

  try {
    const liveResult = createStripeObjectsForMode(liveRunner, 'live', product, currency);
    product.stripe_product_id.live = liveResult.productId;
    product.variants.forEach((variant) => {
      variant.stripe_price_id.live = liveResult.priceIdByVariant.get(variant) ?? null;
    });
  } catch (error) {
    onLiveError?.(error);
  }
}

async function ask(rl, question) {
  const answer = await rl.question(`${question} `);
  return answer.trim();
}

async function askRequired(rl, question) {
  while (true) {
    const answer = await ask(rl, question);
    if (answer) return answer;
    console.log('This field is required.');
  }
}

async function askConfirm(rl, question) {
  const answer = await ask(rl, `${question} (y/N)`);
  return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
}

async function promptSource(rl, index) {
  console.log(`\nSource ${index + 1} — one Printful sync product covers one colour.`);
  const idInput = await askRequired(rl, 'Printful sync product ID:');
  const printful_sync_product_id = Number(idInput);
  if (!Number.isInteger(printful_sync_product_id) || printful_sync_product_id <= 0) {
    throw new Error(`"${idInput}" is not a valid Printful sync product ID`);
  }
  const color = await askRequired(rl, 'Public colour label (e.g. Noir):');
  const sizes = parseSizes(
    await askRequired(rl, 'Public sizes, comma-separated, in order (e.g. S,M,L,XL,2XL):'),
  );
  const size_aliases = parseSizeAliases(
    await ask(rl, "Size aliases if Printful's own names differ (PRINTFUL=PUBLIC, comma-separated, or blank):"),
  );
  return { printful_sync_product_id, color, sizes, ...(size_aliases ? { size_aliases } : {}) };
}

async function promptSources(rl) {
  const sources = [await promptSource(rl, 0)];
  if (await askConfirm(rl, '\nAdd a second colour (a second Printful source) for this product?')) {
    sources.push(await promptSource(rl, 1));
  }
  return sources;
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const schema = loadProductsSchema();
    const slugPattern = new RegExp(schema.$defs.product.properties.slug.pattern);
    const pricePattern = new RegExp(schema.$defs.product.properties.price.pattern);

    const catalogue = JSON.parse(await fs.readFile(CATALOGUE_PATH, 'utf8'));

    console.log('VertiFlow — add a product\n');
    const slug = process.argv[2] ?? await askRequired(rl, 'Product slug (lowercase, hyphenated, e.g. veste-shell-vf):');
    assertSlugAvailable(catalogue, slug, slugPattern);

    const name = await askRequired(rl, 'Product name (as customers will see it):');
    assertNotBannedName(name, 'Product');
    const price = await askRequired(rl, 'Retail price, e.g. 34.99:');
    assertValidPrice(price, pricePattern);

    const sources = await promptSources(rl);

    if (!(await askConfirm(rl, `\nFetch ${sources.length} Printful source(s) for "${slug}" now?`))) {
      console.log('Aborted. Nothing was written.');
      return;
    }

    const storeId = validatePrintfulStoreId(process.env.PRINTFUL_STORE_ID);
    const client = new PrintfulClient({ apiKey: resolvePrintfulApiKey(process.env), storeId });

    console.log('\nFetching from Printful...');
    const productDetails = await Promise.all(
      sources.map((source) => client.getSyncProduct(source.printful_sync_product_id)),
    );
    productDetails.forEach(({ sync_product: syncProduct }, index) => {
      const label = `Printful source ${index + 1}`;
      console.log(`  ${label}: "${syncProduct?.name}" (id ${sources[index].printful_sync_product_id})`);
      assertNotBannedName(syncProduct?.name ?? '', label);
    });

    const catalogVariantIds = new Set();
    productDetails.forEach(({ sync_variants: syncVariants = [] }) => {
      syncVariants.forEach((syncVariant) => {
        const id = Number(syncVariant.variant_id ?? syncVariant.product?.variant_id);
        if (Number.isInteger(id) && id > 0) catalogVariantIds.add(id);
      });
    });
    const catalogVariantEntries = await Promise.all(
      [...catalogVariantIds].map(async (id) => [id, await client.getCatalogVariant(id)]),
    );

    const built = buildCommercialCatalogue({
      config: { currency: catalogue.currency, products: [{ slug, name, price, sources }] },
      productDetails,
      catalogVariants: new Map(catalogVariantEntries),
      generatedAt: catalogue.generated_at,
    });
    const [newProduct] = built.products;

    console.log(`\nResolved ${newProduct.variants.length} active variant(s):`);
    newProduct.variants.forEach((variant) => {
      console.log(`  - ${variant.color} / ${variant.size}`);
    });

    if (!(await askConfirm(rl, '\nCreate the matching Stripe product and prices in TEST and LIVE mode now?'))) {
      console.log('Stopped before touching Stripe. Nothing was written to data/products.json.');
      return;
    }

    console.log('\nCreating Stripe objects (test mode)...');
    attachStripeIds(newProduct, catalogue.currency, {
      onLiveError: (error) => {
        console.warn(`\nLive-mode Stripe creation failed: ${error.message}`);
        console.warn('Continuing with test-mode IDs only. Re-run scripts/create-live-stripe-catalogue.js once live permissions are fixed to backfill live IDs.');
      },
    });

    const freshCatalogue = JSON.parse(await fs.readFile(CATALOGUE_PATH, 'utf8'));
    assertSlugAvailable(freshCatalogue, slug, slugPattern);
    freshCatalogue.products.push(newProduct);
    validateProductsCatalogue(freshCatalogue, schema);

    await writeJsonAtomically(CATALOGUE_PATH, freshCatalogue);

    console.log(`\nAdded "${slug}" to data/products.json.`);
    console.log(`Next: write copy for "${slug}" in ${PRODUCT_COPY_PATH} (lead, body, specs).`);
    console.log(`Next: add images for "${slug}" in ${PRODUCT_MEDIA_PATH} (one array per colour).`);
    if (!newProduct.stripe_product_id.live) {
      console.log('Reminder: live Stripe IDs are still null for this product — see the warning above.');
    }
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = {
  main,
  assertSlugAvailable,
  assertValidPrice,
  assertNotBannedName,
  parseSizes,
  parseSizeAliases,
  attachStripeIds,
  createStripeObjectsForMode,
  ensureStripeProduct,
  ensureStripePrice,
};
