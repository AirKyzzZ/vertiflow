const crypto = require('node:crypto');

function priceLookupKey(productSlug, syncVariantId, currency) {
  return `vertiflow_${productSlug}_${syncVariantId}_${currency.toLowerCase()}`;
}

function hashedIdempotencyKey(namespace, semanticInputs) {
  const hash = crypto.createHash('sha256')
    .update(JSON.stringify(semanticInputs))
    .digest('hex');
  return `vertiflow_${namespace}_${hash}`;
}

function productIdempotencyKey(productSlug) {
  return hashedIdempotencyKey('product', { commercialSlug: productSlug });
}

function priceIdempotencyKey({
  productSlug,
  syncVariantId,
  currency,
  unitAmount,
  stripeProductId,
  priorActivePriceIds,
  lookupKey,
  transferLookupKey,
}) {
  return hashedIdempotencyKey('price', {
    productSlug,
    syncVariantId: String(syncVariantId),
    currency: currency.toLowerCase(),
    unitAmount,
    stripeProductId,
    priorActivePriceIds: [...priorActivePriceIds].sort(),
    lookupKey,
    transferLookupKey,
  });
}

function readTestId(raw) {
  if (typeof raw === 'string') return raw || null;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return typeof raw.test === 'string' && raw.test ? raw.test : null;
  }
  return null;
}

function withTestId(raw, newTestId) {
  const priorLive = raw && typeof raw === 'object' && !Array.isArray(raw) && typeof raw.live === 'string'
    ? raw.live
    : null;
  return { test: newTestId, live: priorLive };
}

function priceInMinorUnits(retailPrice) {
  const amount = Number(retailPrice);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`Invalid catalogue retail price: ${retailPrice}`);
  }

  return Math.round(amount * 100);
}

function productMetadata(product) {
  return {
    integration: 'vertiflow',
    commercial_slug: product.slug,
  };
}

function priceMetadata(product, variant) {
  return {
    integration: 'vertiflow',
    printful_sync_product_id: String(variant.printful_sync_product_id),
    printful_sync_variant_id: String(variant.printful_sync_variant_id),
    printful_catalog_variant_id: String(variant.printful_catalog_variant_id),
    commercial_slug: product.slug,
  };
}

function priceDescription(variant) {
  return variant.name ? { nickname: variant.name } : {};
}

async function listAllProducts(stripe) {
  const products = [];
  let startingAfter;

  while (true) {
    const page = await stripe.products.list({
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    products.push(...page.data);

    if (!page.has_more || page.data.length === 0) {
      return products;
    }

    startingAfter = page.data.at(-1).id;
  }
}

async function findProduct(stripe, product, knownProducts) {
  const managedProducts = knownProducts.filter(
    (candidate) => candidate.metadata?.integration === 'vertiflow'
      && candidate.metadata?.commercial_slug === product.slug,
  );
  if (managedProducts.length > 1) {
    throw new Error(`Multiple managed Stripe Products found for commercial slug ${product.slug}`);
  }

  const existingTestProductId = readTestId(product.stripe_product_id);
  if (existingTestProductId) {
    return stripe.products.retrieve(existingTestProductId);
  }

  return managedProducts[0];
}

function productParams(product) {
  return {
    name: product.name,
    active: product.active,
    shippable: true,
    metadata: productMetadata(product),
    ...(product.thumbnail_url ? { images: [product.thumbnail_url] } : {}),
  };
}

async function reconcileProduct(stripe, product, knownProducts) {
  const existingProduct = await findProduct(stripe, product, knownProducts);

  if (existingProduct) {
    return stripe.products.update(existingProduct.id, productParams(product));
  }

  return stripe.products.create(productParams(product), {
    idempotencyKey: productIdempotencyKey(product.slug),
  });
}

function hasVariantMetadata(price, variant) {
  return price.metadata?.integration === 'vertiflow'
    && price.metadata?.printful_sync_product_id === String(variant.printful_sync_product_id)
    && price.metadata?.printful_sync_variant_id === String(variant.printful_sync_variant_id);
}

async function listActiveProductPrices(stripe, productId) {
  const prices = [];
  let startingAfter;

  while (true) {
    const page = await stripe.prices.list({
      active: true,
      product: productId,
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    prices.push(...page.data);

    if (!page.has_more) {
      return prices;
    }
    if (page.data.length === 0) {
      throw new Error(`Stripe returned an empty active Price page for product ${productId}`);
    }

    startingAfter = page.data.at(-1).id;
  }
}

async function findPrices(stripe, variant, lookupKey, stripeProduct) {
  const prices = [];

  function addPrice(price) {
    if (price && !prices.some((candidate) => candidate.id === price.id)) {
      prices.push(price);
    }
  }

  const existingTestPriceId = readTestId(variant.stripe_price_id);
  if (existingTestPriceId) {
    addPrice(await stripe.prices.retrieve(existingTestPriceId));
  }

  const lookupPrices = await stripe.prices.list({
    active: true,
    lookup_keys: [lookupKey],
    limit: 1,
  });
  for (const price of lookupPrices.data) {
    addPrice(price);
  }

  for (const price of await listActiveProductPrices(stripe, stripeProduct.id)) {
    if (hasVariantMetadata(price, variant)) {
      addPrice(price);
    }
  }

  return prices;
}

function priceProductId(price) {
  return typeof price?.product === 'string' ? price.product : price?.product?.id;
}

function priceMatches(price, { stripeProduct, currency, unitAmount }) {
  return price
    && price.active
    && price.currency === currency.toLowerCase()
    && price.unit_amount === unitAmount
    && priceProductId(price) === stripeProduct.id;
}

function priceUpdateParams(product, variant, lookupKey, assignLookupKey) {
  return {
    ...(assignLookupKey ? { lookup_key: lookupKey, transfer_lookup_key: true } : {}),
    metadata: priceMetadata(product, variant),
    ...priceDescription(variant),
  };
}

async function archivePrices(stripe, prices, retainedPriceId) {
  for (const price of prices) {
    if (price.active && price.id !== retainedPriceId) {
      await stripe.prices.update(price.id, { active: false });
    }
  }
}

async function reconcilePrice(stripe, { product, variant, stripeProduct, currency }) {
  const lookupKey = priceLookupKey(product.slug, variant.printful_sync_variant_id, currency);
  const unitAmount = priceInMinorUnits(product.price);
  const existingPrices = await findPrices(stripe, variant, lookupKey, stripeProduct);
  const matchingPrice = existingPrices.find((price) => priceMatches(price, {
    stripeProduct,
    currency,
    unitAmount,
  }));

  if (matchingPrice) {
    const updatedPrice = await stripe.prices.update(
      matchingPrice.id,
      priceUpdateParams(product, variant, lookupKey, matchingPrice.lookup_key !== lookupKey),
    );
    await archivePrices(stripe, existingPrices, matchingPrice.id);
    return updatedPrice;
  }

  const createdPrice = await stripe.prices.create({
    product: stripeProduct.id,
    currency: currency.toLowerCase(),
    unit_amount: unitAmount,
    lookup_key: lookupKey,
    transfer_lookup_key: existingPrices.length > 0,
    ...priceDescription(variant),
    metadata: priceMetadata(product, variant),
  }, {
    idempotencyKey: priceIdempotencyKey({
      productSlug: product.slug,
      syncVariantId: variant.printful_sync_variant_id,
      currency,
      unitAmount,
      stripeProductId: stripeProduct.id,
      priorActivePriceIds: existingPrices
        .filter((price) => price.active && typeof price.id === 'string')
        .map((price) => price.id)
        .sort(),
      lookupKey,
      transferLookupKey: existingPrices.length > 0,
    }),
  });

  await archivePrices(stripe, existingPrices, createdPrice.id);

  return createdPrice;
}

async function reconcileCatalogue(stripe, catalogue) {
  const reconciledCatalogue = structuredClone(catalogue);
  const knownProducts = await listAllProducts(stripe);

  for (const product of reconciledCatalogue.products) {
    const stripeProduct = await reconcileProduct(stripe, product, knownProducts);
    product.stripe_product_id = withTestId(product.stripe_product_id, stripeProduct.id);

    for (const variant of product.variants) {
      if (!variant.active) {
        continue;
      }

      const stripePrice = await reconcilePrice(stripe, {
        product,
        variant,
        stripeProduct,
        currency: reconciledCatalogue.currency,
      });
      variant.stripe_price_id = withTestId(variant.stripe_price_id, stripePrice.id);
    }
  }

  return reconciledCatalogue;
}

module.exports = {
  listAllProducts,
  listActiveProductPrices,
  findPrices,
  priceInMinorUnits,
  priceIdempotencyKey,
  readTestId,
  priceLookupKey,
  productIdempotencyKey,
  reconcileCatalogue,
  reconcilePrice,
  reconcileProduct,
};
