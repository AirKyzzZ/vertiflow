#!/usr/bin/env node

require('dotenv').config();

const fs = require('node:fs/promises');
const path = require('node:path');
const {
  PrintfulClient,
  fetchCommercialCatalogue,
  resolvePrintfulApiKey,
  validateCommercialCatalogue,
  validatePrintfulStoreId,
} = require('./lib/printful-catalogue');

const OUTPUT_PATH = path.resolve(__dirname, '../data/products.json');
const CONFIG_PATH = path.resolve(__dirname, '../data/storefront-products.json');

async function writeJsonAtomically(filePath, value) {
  const directory = path.dirname(filePath);
  const temporaryPath = `${filePath}.tmp`;

  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await fs.rename(temporaryPath, filePath);
}

async function writeValidatedCatalogueAtomically(filePath, catalogue, config) {
  validateCommercialCatalogue(catalogue, config);
  await writeJsonAtomically(filePath, catalogue);
}

async function readExistingCatalogue() {
  try {
    return JSON.parse(await fs.readFile(OUTPUT_PATH, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return undefined;
    }

    throw error;
  }
}

async function readCommercialConfig() {
  return JSON.parse(await fs.readFile(CONFIG_PATH, 'utf8'));
}

async function main() {
  const storeId = validatePrintfulStoreId(process.env.PRINTFUL_STORE_ID);
  const client = new PrintfulClient({
    apiKey: resolvePrintfulApiKey(process.env),
    storeId,
  });
  const [existingCatalogue, config] = await Promise.all([
    readExistingCatalogue(),
    readCommercialConfig(),
  ]);
  const catalogue = await fetchCommercialCatalogue(client, {
    config,
    existingCatalogue,
  });

  await writeValidatedCatalogueAtomically(OUTPUT_PATH, catalogue, config);

  const activeVariants = catalogue.products.reduce(
    (total, product) => total + product.variants.filter((variant) => variant.active).length,
    0,
  );

  process.stdout.write(
    `Synced ${catalogue.products.length} commercial products and ${activeVariants} active variants\n`,
  );
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = {
  main,
  writeValidatedCatalogueAtomically,
};
