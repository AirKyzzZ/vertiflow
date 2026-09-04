const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  buildAlternates,
  HOME_PATHS,
  SHOP_PATHS,
  productPaths,
  LOCALES,
  HREFLANG,
} = require('../src/lib/i18n/locale.ts');
const catalogue = require('../data/products.json');

function assertSelfReferencing(locale, paths) {
  const alternates = buildAlternates(locale, paths);
  assert.equal(alternates.canonical, paths[locale], "canonical must equal this page's own path");

  for (const loc of LOCALES) {
    assert.equal(
      alternates.languages[HREFLANG[loc]],
      paths[loc],
      `${HREFLANG[loc]} must point at the ${loc} version`,
    );
  }

  assert.equal(
    alternates.languages[HREFLANG[locale]],
    paths[locale],
    'self-reference is missing: the current locale must list itself in languages',
  );
  assert.ok('x-default' in alternates.languages, 'x-default is missing');
}

test('home alternates are self-referencing in both locales', () => {
  assertSelfReferencing('fr', HOME_PATHS);
  assertSelfReferencing('en', HOME_PATHS);
});

test('shop alternates are self-referencing in both locales', () => {
  assertSelfReferencing('fr', SHOP_PATHS);
  assertSelfReferencing('en', SHOP_PATHS);
});

test('every product page alternates are self-referencing in both locales', () => {
  for (const product of catalogue.products) {
    const paths = productPaths(product.slug);
    assertSelfReferencing('fr', paths);
    assertSelfReferencing('en', paths);
  }
});

test('x-default always points at the French version', () => {
  assert.equal(buildAlternates('en', SHOP_PATHS).languages['x-default'], SHOP_PATHS.fr);
  assert.equal(buildAlternates('fr', SHOP_PATHS).languages['x-default'], SHOP_PATHS.fr);
});

test('French in-scope routes are unchanged from their pre-i18n URLs', () => {
  assert.equal(HOME_PATHS.fr, '/');
  assert.equal(SHOP_PATHS.fr, '/boutique');
  assert.equal(productPaths('tshirt-climb').fr, '/boutique/tshirt-climb');
});

test('English in-scope routes live under /en', () => {
  assert.equal(HOME_PATHS.en, '/en');
  assert.equal(SHOP_PATHS.en, '/en/shop');
  assert.equal(productPaths('tshirt-climb').en, '/en/shop/tshirt-climb');
});

const PAGE_FILES = [
  'src/app/page.tsx',
  'src/app/en/page.tsx',
  'src/app/boutique/page.tsx',
  'src/app/en/shop/page.tsx',
  'src/app/boutique/[slug]/page.tsx',
  'src/app/en/shop/[slug]/page.tsx',
];

test('every in-scope localized page wires its metadata through buildAlternates', () => {
  for (const relativePath of PAGE_FILES) {
    const source = fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
    assert.match(source, /buildAlternates\(/, `${relativePath} must set alternates via buildAlternates()`);
  }
});
