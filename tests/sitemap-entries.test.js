const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildSitemapEntries } = require('../src/lib/sitemap-entries.ts');
const catalogue = require('../data/products.json');

const JOURNAL_SLUGS = ['pkba-partenariat-2025', 'la-teste-de-buch-2025', 'metz-2025'];

function entries() {
  return buildSitemapEntries(catalogue.products, JOURNAL_SLUGS);
}

test('sitemap contains every product slug, in both locales', () => {
  const urls = entries().map((entry) => entry.url);
  for (const product of catalogue.products) {
    assert.ok(
      urls.includes(`https://vertiflow.fr/boutique/${product.slug}`),
      `${product.slug} missing from the French sitemap`,
    );
    assert.ok(
      urls.includes(`https://vertiflow.fr/en/shop/${product.slug}`),
      `${product.slug} missing from the English sitemap`,
    );
  }
});

test('no transactional route appears in the sitemap', () => {
  const urls = entries().map((entry) => entry.url);
  for (const forbidden of ['/panier', '/commande']) {
    assert.ok(
      !urls.some((url) => url.includes(forbidden)),
      `${forbidden} must never appear in the sitemap`,
    );
  }
});

test('every sitemap url is absolute, under the canonical domain', () => {
  for (const entry of entries()) {
    assert.match(entry.url, /^https:\/\/vertiflow\.fr\//);
  }
});

test('the sitemap has no duplicate urls', () => {
  const urls = entries().map((entry) => entry.url);
  assert.equal(new Set(urls).size, urls.length);
});

test('localized entries self-reference in alternates.languages', () => {
  const home = entries().find((entry) => entry.url === 'https://vertiflow.fr/');
  assert.deepEqual(home.alternates.languages, {
    'x-default': 'https://vertiflow.fr/',
    'fr-FR': 'https://vertiflow.fr/',
    'en-US': 'https://vertiflow.fr/en',
  });

  const shopEn = entries().find((entry) => entry.url === 'https://vertiflow.fr/en/shop');
  assert.deepEqual(shopEn.alternates.languages, {
    'x-default': 'https://vertiflow.fr/boutique',
    'fr-FR': 'https://vertiflow.fr/boutique',
    'en-US': 'https://vertiflow.fr/en/shop',
  });
});

test('French-only routes carry no language alternates', () => {
  const cgv = entries().find((entry) => entry.url === 'https://vertiflow.fr/cgv');
  assert.ok(cgv, 'cgv must be in the sitemap');
  assert.equal(cgv.alternates, undefined);
});

test('every journal post slug is included', () => {
  const urls = entries().map((entry) => entry.url);
  for (const slug of JOURNAL_SLUGS) {
    assert.ok(urls.includes(`https://vertiflow.fr/journal/${slug}`));
  }
});

test('sitemap.ts wires buildSitemapEntries to the real catalogue and journal data', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src/app/sitemap.ts'), 'utf8');
  assert.match(source, /buildSitemapEntries\(/);
  assert.match(source, /getProducts\(/);
  assert.match(source, /getJournalPosts\(/);
});
