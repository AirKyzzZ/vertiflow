class ValidationError extends Error {}

const ISO_COUNTRIES = new Set(
  'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' '),
);

function stringValue(value, field, { required = false, maxLength = 500 } = {}) {
  if (value == null) {
    if (required) throw new ValidationError(`${field} is required`);
    return '';
  }
  if (typeof value !== 'string') throw new ValidationError(`${field} must be a string`);
  const trimmed = value.trim();
  if (!trimmed) {
    if (required) throw new ValidationError(`${field} is required`);
    return '';
  }
  if (trimmed.length > maxLength) throw new ValidationError(`${field} is too long`);
  return trimmed;
}

function requiredString(value, field, maxLength) {
  return stringValue(value, field, { required: true, maxLength });
}

function optionalString(value, field, maxLength) {
  return stringValue(value, field, { maxLength });
}

function reviewedUnitAmount(value) {
  if (typeof value !== 'string') throw new ValidationError('Invalid catalogue');
  const match = value.match(/^(0|[1-9][0-9]{0,12})\.([0-9]{2})$/);
  if (!match) throw new ValidationError('Invalid catalogue');
  const amount = (Number(match[1]) * 100) + Number(match[2]);
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new ValidationError('Invalid catalogue');
  return amount;
}

function positiveCatalogueId(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function resolveCart(catalogue, items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ValidationError('Cart must contain at least one item');
  }
  if (items.length > 100) throw new ValidationError('Cart may contain at most 100 lines');
  if (!Array.isArray(catalogue?.products) || !/^[A-Z]{3}$/.test(catalogue.currency || '')) {
    throw new ValidationError('Invalid catalogue');
  }
  const currency = catalogue.currency.toLowerCase();

  const catalogueOptions = new Map();
  for (const product of catalogue.products) {
    if (!product || product.active === false || !Array.isArray(product.variants)) continue;
    const unitAmount = reviewedUnitAmount(product.price);
    for (const variant of product.variants) {
      const key = `${product.slug}\u0000${variant?.color}\u0000${variant?.size}`;
      if (catalogueOptions.has(key)) throw new ValidationError('Duplicate catalogue option');
      catalogueOptions.set(key, { product, variant, unitAmount });
    }
  }

  const requestedOptions = new Set();
  return items.map((item) => {
    if (!item || typeof item !== 'object') throw new ValidationError('Invalid cart item');
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) {
      throw new ValidationError('Item quantity must be an integer between 1 and 10');
    }
    const key = `${item.slug}\u0000${item.color}\u0000${item.size}`;
    if (requestedOptions.has(key)) throw new ValidationError('Duplicate cart option');
    requestedOptions.add(key);
    const entry = catalogueOptions.get(key);
    const product = entry?.product;
    const variant = entry?.variant;
    if (
      !variant?.active
      || typeof product?.slug !== 'string'
      || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug)
      || typeof product.name !== 'string'
      || !product.name.trim()
      || product.name.length > 200
      || typeof product.stripe_product_id !== 'string'
      || !/^prod_[A-Za-z0-9_]+$/.test(product.stripe_product_id)
      || typeof variant.stripe_price_id !== 'string'
      || !/^price_[A-Za-z0-9_]+$/.test(variant.stripe_price_id)
      || !positiveCatalogueId(variant.printful_sync_product_id)
      || !positiveCatalogueId(variant.printful_sync_variant_id)
      || !positiveCatalogueId(variant.printful_catalog_variant_id)
      || typeof variant.color !== 'string'
      || !variant.color.trim()
      || variant.color.length > 100
      || typeof variant.size !== 'string'
      || !variant.size.trim()
      || variant.size.length > 100
    ) {
      throw new ValidationError('Unknown catalogue option');
    }
    return {
      priceId: variant.stripe_price_id,
      stripeProductId: product.stripe_product_id,
      currency,
      unitAmount: entry.unitAmount,
      slug: product.slug,
      syncProductId: variant.printful_sync_product_id,
      syncVariantId: variant.printful_sync_variant_id,
      catalogVariantId: variant.printful_catalog_variant_id,
      quantity: item.quantity,
      name: product.name.trim(),
      color: variant.color.trim(),
      size: variant.size.trim(),
    };
  });
}

function validateCustomer(customer) {
  if (!customer || typeof customer !== 'object') throw new ValidationError('Customer is required');
  const address = customer.address;
  if (!address || typeof address !== 'object') throw new ValidationError('Customer address is required');

  const email = requiredString(customer.email, 'email', 320).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ValidationError('Invalid email');
  const country = requiredString(address.country, 'country', 2).toUpperCase();
  if (country === 'UK') throw new ValidationError('Use GB rather than UK');
  if (!ISO_COUNTRIES.has(country)) throw new ValidationError('Invalid country');
  if (country === 'BR') throw new ValidationError('Brazil shipping requires a tax number');
  const state = optionalString(address.state, 'address.state', 100);
  if (['US', 'CA', 'AU'].includes(country) && !state) throw new ValidationError('A state is required for this country');

  return {
    firstName: requiredString(customer.firstName, 'firstName', 100),
    lastName: requiredString(customer.lastName, 'lastName', 100),
    email,
    phone: optionalString(customer.phone, 'phone', 50),
    address: {
      line1: requiredString(address.line1, 'address.line1', 200),
      line2: optionalString(address.line2, 'address.line2', 200),
      city: requiredString(address.city, 'address.city', 200),
      postal_code: requiredString(address.postal_code, 'address.postal_code', 50),
      country,
      state,
    },
  };
}

module.exports = { resolveCart, reviewedUnitAmount, validateCustomer, ValidationError };
