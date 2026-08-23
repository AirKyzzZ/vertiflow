const fs = require('node:fs');
const path = require('node:path');

const SCHEMA_PATH = path.resolve(__dirname, '../../data/products.schema.json');

function loadProductsSchema() {
  return JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
}

function assertExactKeys(value, keys, contextPath) {
  const actualKeys = Object.keys(value).sort();
  const expectedKeys = [...keys].sort();
  if (actualKeys.length !== expectedKeys.length || actualKeys.some((key, index) => key !== expectedKeys[index])) {
    throw new Error(`${contextPath} has unexpected or missing properties`);
  }
}

function assertNonEmptyString(value, contextPath) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${contextPath} must be a non-empty string`);
  }
}

function assertNullableString(value, contextPath) {
  if (value !== null && typeof value !== 'string') {
    throw new Error(`${contextPath} must be a string or null`);
  }
}

function assertNullableModeKeyedId(value, contextPath) {
  if (value === null || typeof value === 'string') return;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    assertExactKeys(value, ['test', 'live'], contextPath);
    assertNullableString(value.test, `${contextPath}.test`);
    assertNullableString(value.live, `${contextPath}.live`);
    return;
  }
  throw new Error(`${contextPath} must be a string, null, or a {test, live} object`);
}

function assertPositiveInteger(value, contextPath) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${contextPath} must be a positive integer`);
  }
}

function assertPattern(value, pattern, contextPath) {
  if (typeof value !== 'string' || !pattern.test(value)) {
    throw new Error(`${contextPath} does not match the schema pattern`);
  }
}

function validateProductsCatalogue(catalogue, schema = loadProductsSchema()) {
  const productDef = schema.$defs.product;
  const variantDef = schema.$defs.variant;
  const slugPattern = new RegExp(productDef.properties.slug.pattern);
  const pricePattern = new RegExp(productDef.properties.price.pattern);
  const currencyPattern = new RegExp(schema.properties.currency.pattern);
  const idBounds = productDef.properties.printful_sync_product_ids;
  const minProducts = schema.properties.products.minItems ?? 0;
  const maxProducts = schema.properties.products.maxItems ?? Infinity;

  if (!catalogue || typeof catalogue !== 'object' || Array.isArray(catalogue)) {
    throw new Error('catalogue must be an object');
  }
  assertExactKeys(catalogue, schema.required, 'catalogue');
  if (catalogue.schema_version !== schema.properties.schema_version.const) {
    throw new Error(`catalogue.schema_version must be ${schema.properties.schema_version.const}`);
  }
  if (typeof catalogue.generated_at !== 'string' || Number.isNaN(Date.parse(catalogue.generated_at))) {
    throw new Error('catalogue.generated_at must be a date-time string');
  }
  assertPattern(catalogue.currency, currencyPattern, 'catalogue.currency');
  if (
    !Array.isArray(catalogue.products)
    || catalogue.products.length < minProducts
    || catalogue.products.length > maxProducts
  ) {
    const bound = maxProducts === Infinity ? `at least ${minProducts}` : `between ${minProducts} and ${maxProducts}`;
    throw new Error(`catalogue.products must contain ${bound} products`);
  }

  const seenSlugs = new Set();
  catalogue.products.forEach((product, productIndex) => {
    const productPath = `products[${productIndex}]`;
    if (!product || typeof product !== 'object' || Array.isArray(product)) {
      throw new Error(`${productPath} must be an object`);
    }
    assertExactKeys(product, productDef.required, productPath);
    assertPattern(product.slug, slugPattern, `${productPath}.slug`);
    if (seenSlugs.has(product.slug)) {
      throw new Error(`${productPath}.slug "${product.slug}" is duplicated`);
    }
    seenSlugs.add(product.slug);
    assertNonEmptyString(product.name, `${productPath}.name`);
    assertPattern(product.price, pricePattern, `${productPath}.price`);
    if (
      !Array.isArray(product.printful_sync_product_ids)
      || product.printful_sync_product_ids.length < idBounds.minItems
      || product.printful_sync_product_ids.length > idBounds.maxItems
      || new Set(product.printful_sync_product_ids).size !== product.printful_sync_product_ids.length
    ) {
      throw new Error(
        `${productPath}.printful_sync_product_ids must contain between ${idBounds.minItems} and `
          + `${idBounds.maxItems} unique IDs`,
      );
    }
    product.printful_sync_product_ids.forEach((id, index) => {
      assertPositiveInteger(id, `${productPath}.printful_sync_product_ids[${index}]`);
    });
    assertNullableModeKeyedId(product.stripe_product_id, `${productPath}.stripe_product_id`);
    if (!Array.isArray(product.variants) || product.variants.length === 0) {
      throw new Error(`${productPath}.variants must be a non-empty array`);
    }
    product.variants.forEach((variant, variantIndex) => {
      const variantPath = `${productPath}.variants[${variantIndex}]`;
      if (!variant || typeof variant !== 'object' || Array.isArray(variant)) {
        throw new Error(`${variantPath} must be an object`);
      }
      assertExactKeys(variant, variantDef.required, variantPath);
      assertNonEmptyString(variant.color, `${variantPath}.color`);
      assertNonEmptyString(variant.size, `${variantPath}.size`);
      assertNullableString(variant.printful_color, `${variantPath}.printful_color`);
      assertNullableString(variant.printful_size, `${variantPath}.printful_size`);
      assertPositiveInteger(variant.printful_sync_product_id, `${variantPath}.printful_sync_product_id`);
      assertPositiveInteger(variant.printful_sync_variant_id, `${variantPath}.printful_sync_variant_id`);
      assertPositiveInteger(variant.printful_catalog_variant_id, `${variantPath}.printful_catalog_variant_id`);
      assertNullableModeKeyedId(variant.stripe_price_id, `${variantPath}.stripe_price_id`);
      assertNullableString(variant.image_url, `${variantPath}.image_url`);
      if (variant.active !== true) {
        throw new Error(`${variantPath}.active must be true`);
      }
    });
  });
}

module.exports = {
  loadProductsSchema,
  validateProductsCatalogue,
};
