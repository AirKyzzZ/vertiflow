const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  SITE_URL,
  organizationJsonLd,
  buildBreadcrumbJsonLd,
  buildProductJsonLd,
} = require('../src/lib/structured-data.ts');
const { mediaFor } = require('../src/lib/product-media.ts');
const catalogue = require('../data/products.json');

function activeColours(product) {
  return [...new Set(product.variants.filter((variant) => variant.active).map((variant) => variant.color))];
}

test('organization json-ld has no address and points at the real instagram handle', () => {
  assert.equal(organizationJsonLd['@type'], 'Organization');
  assert.equal(organizationJsonLd.url, SITE_URL);
  assert.ok(!('address' in organizationJsonLd), 'VertiFlow has no physical shop; address must be omitted');
  assert.deepEqual(organizationJsonLd.sameAs, ['https://www.instagram.com/vertiflowfreerun/']);
});

test('product json-ld never sources images from the printful cdn or a blank artwork file', () => {
  for (const product of catalogue.products) {
    const colour = activeColours(product)[0];
    const images = mediaFor(product.slug, colour);
    assert.ok(images.length > 0, `${product.slug} has no media to build json-ld from`);

    const jsonLd = buildProductJsonLd({
      name: product.name,
      description: 'test description',
      sku: product.slug,
      price: product.price,
      url: `/boutique/${product.slug}`,
      images,
      inStock: true,
    });

    assert.ok(jsonLd.image.length > 0);
    for (const image of jsonLd.image) {
      assert.ok(!image.includes('files.cdn.printful.com'), `${product.slug} leaked a Printful CDN url into json-ld`);
      assert.ok(!image.includes('printful'), `${product.slug} leaked a printful reference into json-ld`);
      assert.match(image, /^https:\/\/vertiflow\.fr\/images\/(product|photos)\//);
    }
  }
});

test('product json-ld price is the raw catalogue price, dot-decimal, matching Google’s pattern', () => {
  for (const product of catalogue.products) {
    const jsonLd = buildProductJsonLd({
      name: product.name,
      description: 'x',
      sku: product.slug,
      price: product.price,
      url: `/boutique/${product.slug}`,
      images: ['/images/product/placeholder.png'],
      inStock: true,
    });
    assert.equal(jsonLd.offers.price, product.price);
    assert.match(jsonLd.offers.price, /^[0-9]+\.[0-9]{2}$/);
    assert.equal(jsonLd.offers.priceCurrency, 'EUR');
  }
});

test('product json-ld sku is the honest slug, never a fabricated GTIN/MPN', () => {
  const jsonLd = buildProductJsonLd({
    name: 'T-shirt CLIMB',
    description: 'x',
    sku: 'tshirt-climb',
    price: '29.99',
    url: '/boutique/tshirt-climb',
    images: ['/images/product/front_tshirt.png'],
    inStock: true,
  });
  assert.equal(jsonLd.sku, 'tshirt-climb');
});

test('product json-ld is a single Offer, never an AggregateOffer', () => {
  const jsonLd = buildProductJsonLd({
    name: 'x', description: 'x', sku: 'x', price: '1.00',
    url: '/x', images: [], inStock: true,
  });
  assert.equal(jsonLd.offers['@type'], 'Offer');
});

test('product json-ld availability reflects whether any variant is active', () => {
  const inStock = buildProductJsonLd({
    name: 'x', description: 'x', sku: 'x', price: '1.00', url: '/x', images: [], inStock: true,
  });
  const outOfStock = buildProductJsonLd({
    name: 'x', description: 'x', sku: 'x', price: '1.00', url: '/x', images: [], inStock: false,
  });
  assert.equal(inStock.offers.availability, 'https://schema.org/InStock');
  assert.equal(outOfStock.offers.availability, 'https://schema.org/OutOfStock');
});

test('breadcrumb list numbers positions from 1 and omits item on the current page', () => {
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: 'Accueil', item: SITE_URL },
    { name: 'Boutique', item: `${SITE_URL}/boutique` },
    { name: 'T-shirt CLIMB' },
  ]);
  assert.equal(breadcrumb['@type'], 'BreadcrumbList');
  assert.equal(breadcrumb.itemListElement.length, 3);
  assert.deepEqual(
    breadcrumb.itemListElement.map((entry) => entry.position),
    [1, 2, 3],
  );
  assert.ok(!('item' in breadcrumb.itemListElement[2]), 'the current page must not link to itself');
});

const PDP_FILES = ['src/app/boutique/[slug]/page.tsx', 'src/app/en/shop/[slug]/page.tsx'];

test('product pages emit json-ld sourced from mediaFor, never from image_url', () => {
  for (const relativePath of PDP_FILES) {
    const source = fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
    assert.match(source, /buildProductJsonLd\(/, `${relativePath} must emit Product json-ld`);
    assert.match(source, /buildBreadcrumbJsonLd\(/, `${relativePath} must emit BreadcrumbList json-ld`);
    assert.match(source, /mediaFor\(/, `${relativePath} must source json-ld images from mediaFor`);
    assert.doesNotMatch(source, /\.image_url/, `${relativePath} must never read image_url`);
    assert.match(source, /application\/ld\+json/);
  }
});

test('layout renders the Organization json-ld once', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src/app/layout.tsx'), 'utf8');
  assert.match(source, /organizationJsonLd/);
  assert.match(source, /application\/ld\+json/);
});
