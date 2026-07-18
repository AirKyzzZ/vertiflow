const PRINTFUL_API_URL = 'https://api.printful.com';
const DEFAULT_CURRENCY = 'EUR';
const DEFAULT_CONCURRENCY = 5;
const PAGE_SIZE = 100;
const VERTIFLOW_PRINTFUL_STORE_ID = '15558986';
const COMMERCIAL_PRODUCT_COUNT = 9;
const COMMERCIAL_SOURCE_COUNT = 15;
const COMMERCIAL_VARIANT_COUNT = 107;

class PrintfulApiError extends Error {
  constructor(message, { status, path, responseBody } = {}) {
    super(message);
    this.name = 'PrintfulApiError';
    this.status = status;
    this.path = path;
    this.responseBody = responseBody;
  }
}

class PrintfulClient {
  constructor({ apiKey, storeId, fetchImpl = globalThis.fetch }) {
    if (!apiKey) {
      throw new Error('PRINTFUL_API_KEY is required');
    }

    if (typeof fetchImpl !== 'function') {
      throw new Error('A fetch implementation is required');
    }

    this.apiKey = apiKey;
    this.storeId = storeId;
    this.fetch = fetchImpl;
  }

  async request(path, query = {}) {
    const url = new URL(path, PRINTFUL_API_URL);

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });

    const headers = {
      Accept: 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };

    if (this.storeId) {
      headers['X-PF-Store-Id'] = String(this.storeId);
    }

    const response = await this.fetch(url, { headers });
    const responseText = await response.text();
    let responseBody;

    try {
      responseBody = responseText ? JSON.parse(responseText) : {};
    } catch {
      throw new PrintfulApiError('Printful returned invalid JSON', {
        status: response.status,
        path,
        responseBody: responseText,
      });
    }

    if (!response.ok || responseBody.code >= 400) {
      const reason = responseBody.error?.message ?? responseBody.result ?? response.statusText;
      throw new PrintfulApiError(`Printful request failed: ${reason}`, {
        status: response.status,
        path,
        responseBody,
      });
    }

    return responseBody;
  }

  async getSyncProducts() {
    const products = [];
    let offset = 0;

    while (true) {
      const response = await this.request('/store/products', {
        limit: PAGE_SIZE,
        offset,
      });
      const page = Array.isArray(response.result) ? response.result : [];
      products.push(...page);

      const total = Number(response.paging?.total ?? products.length);
      if (page.length === 0 || products.length >= total) {
        return products;
      }

      offset += page.length;
    }
  }

  async getSyncProduct(syncProductId) {
    const response = await this.request(`/store/products/${syncProductId}`);
    return response.result;
  }

  async getCatalogVariant(catalogVariantId) {
    const response = await this.request(`/products/variant/${catalogVariantId}`);
    return response.result?.variant ?? response.result;
  }
}

function slugify(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeRetailPrice(value) {
  const price = Number.parseFloat(value);

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`Invalid Printful retail price: ${value}`);
  }

  return price.toFixed(2);
}

function resolvePrintfulApiKey(environment) {
  const canonicalKey = environment.PRINTFUL_API_KEY?.trim();
  if (canonicalKey) {
    return canonicalKey;
  }

  return environment.PRINTFUL_TOKEN?.trim() || undefined;
}

function validatePrintfulStoreId(value) {
  const storeId = String(value ?? '').trim();
  if (storeId !== VERTIFLOW_PRINTFUL_STORE_ID) {
    throw new Error(`PRINTFUL_STORE_ID must be ${VERTIFLOW_PRINTFUL_STORE_ID}`);
  }
  return storeId;
}

async function mapWithConcurrency(values, concurrency, mapper) {
  const results = new Array(values.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < values.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(values[currentIndex], currentIndex);
    }
  }

  const workerCount = Math.min(concurrency, values.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

function pickImageUrl(syncVariant, catalogVariant, syncProduct) {
  const visibleFile = syncVariant.files?.find((file) => file.visible !== false);

  return visibleFile?.preview_url
    ?? visibleFile?.thumbnail_url
    ?? syncVariant.product?.image
    ?? catalogVariant.image
    ?? syncProduct.thumbnail_url
    ?? null;
}

function buildVariant(syncVariant, catalogVariant, syncProduct, existingVariant) {
  const syncVariantId = Number(syncVariant.id);
  const catalogVariantId = Number(syncVariant.variant_id ?? syncVariant.product?.variant_id);

  if (!Number.isInteger(syncVariantId) || syncVariantId <= 0) {
    throw new Error(`Invalid Printful sync variant ID: ${syncVariant.id}`);
  }

  if (!Number.isInteger(catalogVariantId) || catalogVariantId <= 0) {
    throw new Error(`Missing catalogue variant ID for sync variant ${syncVariantId}`);
  }

  return {
    printful_sync_variant_id: syncVariantId,
    printful_catalog_variant_id: catalogVariantId,
    stripe_price_id: existingVariant?.stripe_price_id ?? null,
    external_id: syncVariant.external_id ?? null,
    sku: syncVariant.sku ?? null,
    name: syncVariant.name ?? catalogVariant.name ?? null,
    size: catalogVariant.size ?? null,
    color: catalogVariant.color ?? null,
    color_code: catalogVariant.color_code ?? null,
    retail_price: normalizeRetailPrice(syncVariant.retail_price),
    image_url: pickImageUrl(syncVariant, catalogVariant, syncProduct),
    active: syncVariant.synced !== false && syncVariant.is_ignored !== true,
  };
}

function buildCatalogue({
  productDetails,
  catalogVariants,
  existingCatalogue,
  currency = DEFAULT_CURRENCY,
  generatedAt,
}) {
  const usedSlugs = new Set();
  const existingProducts = new Map(
    (existingCatalogue?.products ?? []).map((product) => [product.printful_sync_product_id, product]),
  );
  const products = productDetails.map(({ sync_product: syncProduct, sync_variants: syncVariants }) => {
    if (!syncProduct || !Array.isArray(syncVariants)) {
      throw new Error('Unexpected Printful sync product response');
    }

    const syncProductId = Number(syncProduct.id);
    if (!Number.isInteger(syncProductId) || syncProductId <= 0) {
      throw new Error(`Invalid Printful sync product ID: ${syncProduct.id}`);
    }

    const baseSlug = slugify(syncProduct.name);
    if (!baseSlug) {
      throw new Error(`Cannot generate a slug for Printful product ${syncProductId}`);
    }

    const slug = usedSlugs.has(baseSlug) ? `${baseSlug}-${syncProductId}` : baseSlug;
    usedSlugs.add(slug);
    const existingProduct = existingProducts.get(syncProductId);
    const existingVariants = new Map(
      (existingProduct?.variants ?? []).map((variant) => [variant.printful_sync_variant_id, variant]),
    );

    const variants = syncVariants.map((syncVariant) => {
      const catalogVariantId = Number(syncVariant.variant_id ?? syncVariant.product?.variant_id);
      const catalogVariant = catalogVariants.get(catalogVariantId);

      if (!catalogVariant) {
        throw new Error(`Missing catalogue data for Printful variant ${catalogVariantId}`);
      }

      return buildVariant(
        syncVariant,
        catalogVariant,
        syncProduct,
        existingVariants.get(Number(syncVariant.id)),
      );
    });

    if (variants.length === 0) {
      throw new Error(`Printful product ${syncProductId} has no variants`);
    }

    return {
      slug,
      name: syncProduct.name,
      printful_sync_product_id: syncProductId,
      stripe_product_id: existingProduct?.stripe_product_id ?? null,
      external_id: syncProduct.external_id ?? null,
      thumbnail_url: syncProduct.thumbnail_url ?? variants[0].image_url,
      active: variants.some((variant) => variant.active),
      variants,
    };
  });

  return {
    schema_version: 1,
    generated_at: generatedAt ?? new Date().toISOString(),
    currency: currency.toUpperCase(),
    products,
  };
}

function validateAllowlistedProducts(config, summaries) {
  const summaryIds = new Set((summaries ?? []).map((summary) => Number(summary.id)));
  const allowlistedIds = new Set();

  for (const product of config.products ?? []) {
    for (const source of product.sources ?? []) {
      const id = Number(source.printful_sync_product_id);
      if (!Number.isInteger(id) || id <= 0) {
        throw new Error(`Invalid allowlisted Printful product ID: ${source.printful_sync_product_id}`);
      }
      if (allowlistedIds.has(id)) {
        throw new Error(`Duplicate allowlisted Printful product ${id}`);
      }
      allowlistedIds.add(id);
      if (!summaryIds.has(id)) {
        throw new Error(`Missing allowlisted Printful product ${id}`);
      }
    }
  }

  return allowlistedIds;
}

function assertExactKeys(value, keys, path) {
  const actualKeys = Object.keys(value).sort();
  const expectedKeys = [...keys].sort();
  if (actualKeys.length !== expectedKeys.length || actualKeys.some((key, index) => key !== expectedKeys[index])) {
    throw new Error(`${path} has unexpected or missing properties`);
  }
}

function assertNonEmptyString(value, path) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${path} must be a non-empty string`);
  }
}

function assertNullableString(value, path) {
  if (value !== null && typeof value !== 'string') {
    throw new Error(`${path} must be a string or null`);
  }
}

function assertPositiveInteger(value, path) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${path} must be a positive integer`);
  }
}

function configuredCatalogueFacts(config) {
  const products = config?.products;
  if (!Array.isArray(products)) {
    throw new Error('Commercial catalogue configuration is required');
  }
  const sourceIds = [];
  const options = [];
  for (const product of products) {
    assertNonEmptyString(product.slug, 'configured product slug');
    for (const source of product.sources ?? []) {
      assertPositiveInteger(source.printful_sync_product_id, `configured source for ${product.slug}`);
      assertNonEmptyString(source.color, `configured color for ${product.slug}`);
      if (!Array.isArray(source.sizes) || source.sizes.length === 0) {
        throw new Error(`Configured source ${source.printful_sync_product_id} must declare public sizes`);
      }
      const uniqueSizes = new Set();
      for (const size of source.sizes) {
        assertNonEmptyString(size, `configured size for source ${source.printful_sync_product_id}`);
        if (uniqueSizes.has(size)) {
          throw new Error(`Duplicate configured public size ${size} for Printful product ${source.printful_sync_product_id}`);
        }
        uniqueSizes.add(size);
        options.push(`${product.slug}\u0000${source.printful_sync_product_id}\u0000${source.color}\u0000${size}`);
      }
      sourceIds.push(Number(source.printful_sync_product_id));
    }
  }
  return { products, sourceIds, options };
}

function validateCommercialCatalogue(catalogue, config) {
  if (!catalogue || typeof catalogue !== 'object' || Array.isArray(catalogue)) {
    throw new Error('catalogue must be an object');
  }
  assertExactKeys(catalogue, ['schema_version', 'generated_at', 'currency', 'products'], 'catalogue');
  if (catalogue.schema_version !== 2) throw new Error('catalogue.schema_version must be 2');
  if (
    typeof catalogue.generated_at !== 'string'
    || !/^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(catalogue.generated_at)
    || Number.isNaN(Date.parse(catalogue.generated_at))
  ) {
    throw new Error('catalogue.generated_at must be a date-time string');
  }
  if (typeof catalogue.currency !== 'string' || !/^[A-Z]{3}$/.test(catalogue.currency)) {
    throw new Error('catalogue.currency must be a three-letter uppercase currency code');
  }
  if (!Array.isArray(catalogue.products) || catalogue.products.length !== COMMERCIAL_PRODUCT_COUNT) {
    throw new Error('catalogue.products must contain exactly 9 products');
  }

  catalogue.products.forEach((product, productIndex) => {
    const productPath = `products[${productIndex}]`;
    if (!product || typeof product !== 'object' || Array.isArray(product)) {
      throw new Error(`${productPath} must be an object`);
    }
    assertExactKeys(product, ['slug', 'name', 'price', 'printful_sync_product_ids', 'stripe_product_id', 'variants'], productPath);
    if (typeof product.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug)) {
      throw new Error(`${productPath}.slug must be a URL-safe slug`);
    }
    assertNonEmptyString(product.name, `${productPath}.name`);
    if (typeof product.price !== 'string' || !/^[0-9]+\.[0-9]{2}$/.test(product.price)) {
      throw new Error(`${productPath}.price must be a decimal price string`);
    }
    if (
      !Array.isArray(product.printful_sync_product_ids)
      || product.printful_sync_product_ids.length < 1
      || product.printful_sync_product_ids.length > 2
      || new Set(product.printful_sync_product_ids).size !== product.printful_sync_product_ids.length
    ) {
      throw new Error(`${productPath}.printful_sync_product_ids must contain one or two unique IDs`);
    }
    product.printful_sync_product_ids.forEach((id, index) => {
      assertPositiveInteger(id, `${productPath}.printful_sync_product_ids[${index}]`);
    });
    assertNullableString(product.stripe_product_id, `${productPath}.stripe_product_id`);
    if (!Array.isArray(product.variants) || product.variants.length === 0) {
      throw new Error(`${productPath}.variants must be a non-empty array`);
    }
    product.variants.forEach((variant, variantIndex) => {
      const variantPath = `${productPath}.variants[${variantIndex}]`;
      if (!variant || typeof variant !== 'object' || Array.isArray(variant)) {
        throw new Error(`${variantPath} must be an object`);
      }
      assertExactKeys(variant, [
        'color', 'size', 'printful_color', 'printful_size', 'printful_sync_product_id',
        'printful_sync_variant_id', 'printful_catalog_variant_id', 'stripe_price_id',
        'image_url', 'active',
      ], variantPath);
      assertNonEmptyString(variant.color, `${variantPath}.color`);
      assertNonEmptyString(variant.size, `${variantPath}.size`);
      assertNullableString(variant.printful_color, `${variantPath}.printful_color`);
      assertNullableString(variant.printful_size, `${variantPath}.printful_size`);
      assertPositiveInteger(variant.printful_sync_product_id, `${variantPath}.printful_sync_product_id`);
      assertPositiveInteger(variant.printful_sync_variant_id, `${variantPath}.printful_sync_variant_id`);
      assertPositiveInteger(variant.printful_catalog_variant_id, `${variantPath}.printful_catalog_variant_id`);
      assertNullableString(variant.stripe_price_id, `${variantPath}.stripe_price_id`);
      assertNullableString(variant.image_url, `${variantPath}.image_url`);
      if (variant.active !== true) throw new Error(`${variantPath}.active must be true`);
    });
  });

  if (config) {
    const configured = configuredCatalogueFacts(config);
    const uniqueSourceIds = new Set(configured.sourceIds);
    if (
      configured.products.length !== COMMERCIAL_PRODUCT_COUNT
      || configured.sourceIds.length !== COMMERCIAL_SOURCE_COUNT
      || uniqueSourceIds.size !== COMMERCIAL_SOURCE_COUNT
      || configured.options.length !== COMMERCIAL_VARIANT_COUNT
    ) {
      throw new Error('Commercial configuration must contain exactly 9 products, 15 unique sources, and 107 options');
    }

    const variants = catalogue.products.flatMap((product) => product.variants);
    if (
      catalogue.products.length !== COMMERCIAL_PRODUCT_COUNT
      || variants.length !== COMMERCIAL_VARIANT_COUNT
      || variants.some((variant) => variant.active !== true)
    ) {
      throw new Error('Commercial catalogue must contain exactly 107 active variants and zero inactive variants across 9 products and 15 sources');
    }

    const actualOptions = [];
    catalogue.products.forEach((product, index) => {
      const configuredProduct = configured.products[index];
      if (product.slug !== configuredProduct.slug) {
        throw new Error('catalogue option set does not match commercial configuration');
      }
      const expectedSourceIds = configuredProduct.sources.map((source) => Number(source.printful_sync_product_id));
      if (
        product.printful_sync_product_ids.length !== expectedSourceIds.length
        || product.printful_sync_product_ids.some((id, sourceIndex) => id !== expectedSourceIds[sourceIndex])
      ) {
        throw new Error('catalogue option set does not match commercial configuration');
      }
      product.variants.forEach((variant) => {
        actualOptions.push(`${product.slug}\u0000${variant.printful_sync_product_id}\u0000${variant.color}\u0000${variant.size}`);
      });
    });
    const expectedOptions = new Set(configured.options);
    const actualOptionSet = new Set(actualOptions);
    if (
      actualOptionSet.size !== actualOptions.length
      || actualOptionSet.size !== expectedOptions.size
      || [...expectedOptions].some((option) => !actualOptionSet.has(option))
    ) {
      throw new Error('catalogue option set does not match commercial configuration');
    }
  }
}

function buildCommercialCatalogue({
  config,
  productDetails,
  catalogVariants,
  existingCatalogue,
  generatedAt,
}) {
  if (!config || !Array.isArray(config.products)) {
    throw new Error('Commercial catalogue configuration is required');
  }

  const detailsById = new Map();
  for (const detail of productDetails ?? []) {
    const id = Number(detail.sync_product?.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('Unexpected Printful sync product response');
    }
    detailsById.set(id, detail);
  }
  const existingProducts = new Map(
    (existingCatalogue?.products ?? []).map((product) => [product.slug, product]),
  );

  const products = config.products.map((productConfig) => {
    const existingProduct = existingProducts.get(productConfig.slug);
    const existingVariants = new Map(
      (existingProduct?.variants ?? []).map((variant) => [
        Number(variant.printful_sync_variant_id),
        variant,
      ]),
    );
    const usedOptions = new Set();
    const variants = [];

    for (const source of productConfig.sources ?? []) {
      const syncProductId = Number(source.printful_sync_product_id);
      if (!Array.isArray(source.sizes) || source.sizes.length === 0) {
        throw new Error(`Configured source ${syncProductId} must declare public sizes`);
      }
      const expectedSizes = new Set(source.sizes);
      if (expectedSizes.size !== source.sizes.length) {
        throw new Error(`Duplicate configured public size for Printful product ${syncProductId}`);
      }
      const actualSizes = new Set();
      const detail = detailsById.get(syncProductId);
      if (!detail) {
        throw new Error(`Missing allowlisted Printful product ${syncProductId}`);
      }
      const syncProduct = detail.sync_product;
      const syncVariants = detail.sync_variants;
      if (!syncProduct || !Array.isArray(syncVariants)) {
        throw new Error('Unexpected Printful sync product response');
      }
      if (syncVariants.length === 0) {
        throw new Error(`Allowlisted Printful product ${syncProductId} has no variants`);
      }

      for (const syncVariant of syncVariants) {
        const syncVariantId = Number(syncVariant.id);
        if (syncVariant.synced === false || syncVariant.is_ignored === true) {
          throw new Error(`Inactive Printful sync variant ${syncVariantId} for product ${syncProductId}`);
        }
        const catalogVariantId = Number(syncVariant.variant_id ?? syncVariant.product?.variant_id);
        if (!Number.isInteger(syncVariantId) || syncVariantId <= 0) {
          throw new Error(`Invalid Printful sync variant ID: ${syncVariant.id}`);
        }
        if (!Number.isInteger(catalogVariantId) || catalogVariantId <= 0) {
          throw new Error(`Missing catalogue variant ID for sync variant ${syncVariantId}`);
        }
        const catalogVariant = catalogVariants.get(catalogVariantId);
        if (!catalogVariant) {
          throw new Error(`Missing catalogue data for Printful variant ${catalogVariantId}`);
        }
        const publicSize = source.size_aliases?.[catalogVariant.size] ?? catalogVariant.size;
        if (!expectedSizes.has(publicSize)) {
          throw new Error(`Unexpected public size ${publicSize} for Printful product ${syncProductId}`);
        }
        actualSizes.add(publicSize);
        const optionKey = `${source.color}\u0000${publicSize}`;
        if (usedOptions.has(optionKey)) {
          throw new Error(`Duplicate public option ${productConfig.slug}: ${source.color} / ${publicSize}`);
        }
        usedOptions.add(optionKey);
        const existingVariant = existingVariants.get(syncVariantId);
        variants.push({
          color: source.color,
          size: publicSize,
          printful_color: catalogVariant.color ?? null,
          printful_size: catalogVariant.size ?? null,
          printful_sync_product_id: syncProductId,
          printful_sync_variant_id: syncVariantId,
          printful_catalog_variant_id: catalogVariantId,
          stripe_price_id: existingVariant?.stripe_price_id ?? null,
          image_url: pickImageUrl(syncVariant, catalogVariant, syncProduct),
          active: true,
        });
      }
      for (const expectedSize of expectedSizes) {
        if (!actualSizes.has(expectedSize)) {
          throw new Error(`Missing configured public size ${expectedSize} for Printful product ${syncProductId}`);
        }
      }
    }
    if (variants.length === 0) {
      throw new Error(`Commercial product ${productConfig.slug} has no variants`);
    }
    return {
      slug: productConfig.slug,
      name: productConfig.name,
      price: productConfig.price,
      printful_sync_product_ids: productConfig.sources.map((source) => Number(source.printful_sync_product_id)),
      stripe_product_id: existingProduct?.stripe_product_id ?? null,
      variants,
    };
  });

  return {
    schema_version: 2,
    generated_at: generatedAt ?? new Date().toISOString(),
    currency: (config.currency ?? DEFAULT_CURRENCY).toUpperCase(),
    products,
  };
}

async function fetchCatalogue(client, options = {}) {
  const syncProducts = await client.getSyncProducts();

  if (syncProducts.length === 0) {
    throw new Error('Printful returned zero sync products; refusing to overwrite the catalogue');
  }

  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
  const productDetails = await mapWithConcurrency(
    syncProducts,
    concurrency,
    (product) => client.getSyncProduct(product.id),
  );

  const catalogVariantIds = new Set();
  productDetails.forEach(({ sync_variants: syncVariants = [] }) => {
    syncVariants.forEach((syncVariant) => {
      const catalogVariantId = Number(syncVariant.variant_id ?? syncVariant.product?.variant_id);
      if (Number.isInteger(catalogVariantId) && catalogVariantId > 0) {
        catalogVariantIds.add(catalogVariantId);
      }
    });
  });

  const catalogVariantEntries = await mapWithConcurrency(
    [...catalogVariantIds],
    concurrency,
    async (catalogVariantId) => [
      catalogVariantId,
      await client.getCatalogVariant(catalogVariantId),
    ],
  );

  return buildCatalogue({
    productDetails,
    catalogVariants: new Map(catalogVariantEntries),
    currency: options.currency,
    generatedAt: options.generatedAt,
    existingCatalogue: options.existingCatalogue,
  });
}

async function fetchCommercialCatalogue(client, options = {}) {
  const { config } = options;
  const syncProducts = await client.getSyncProducts();
  const allowlistedIds = validateAllowlistedProducts(config, syncProducts);
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
  const productIds = [...allowlistedIds];
  const productDetails = await mapWithConcurrency(
    productIds,
    concurrency,
    (id) => client.getSyncProduct(id),
  );
  const catalogVariantIds = new Set();
  productDetails.forEach(({ sync_variants: syncVariants = [] }) => {
    syncVariants.forEach((syncVariant) => {
      const id = Number(syncVariant.variant_id ?? syncVariant.product?.variant_id);
      if (Number.isInteger(id) && id > 0) catalogVariantIds.add(id);
    });
  });
  const catalogVariantEntries = await mapWithConcurrency(
    [...catalogVariantIds],
    concurrency,
    async (id) => [id, await client.getCatalogVariant(id)],
  );
  return buildCommercialCatalogue({
    config,
    productDetails,
    catalogVariants: new Map(catalogVariantEntries),
    existingCatalogue: options.existingCatalogue,
    generatedAt: options.generatedAt,
  });
}

module.exports = {
  PrintfulApiError,
  PrintfulClient,
  VERTIFLOW_PRINTFUL_STORE_ID,
  buildCommercialCatalogue,
  buildCatalogue,
  fetchCommercialCatalogue,
  fetchCatalogue,
  mapWithConcurrency,
  normalizeRetailPrice,
  resolvePrintfulApiKey,
  slugify,
  validateAllowlistedProducts,
  validateCommercialCatalogue,
  validatePrintfulStoreId,
};
