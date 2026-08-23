const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { redirectMap } = require('../src/lib/redirect-map.ts');

test('every ported legacy path redirects permanently', () => {
  const expected = {
    '/products.html': '/boutique',
    '/tshirt-climb.html': '/boutique/tshirt-climb',
    '/hoodie-vf-definition.html': '/boutique/hoodie-vf-definition',
    '/casquette-vf.html': '/boutique/casquette-vf',
    '/shorts-performance-vf.html': '/boutique/shorts-performance-vf',
    '/coque-vf.html': '/boutique/coque-iphone-vf',
    '/debardeur-vf.html': '/boutique/debardeur-vf',
    '/cache-cou-vf.html': '/boutique/cache-cou-vf',
    '/bob-vf.html': '/boutique/bob-vf',
    '/short-confort-vf.html': '/boutique/short-confort-vf',
    '/checkout.html': '/panier',
    '/success.html': '/commande/succes',
    '/cancel.html': '/commande/annulee',
    '/conditions-generales-de-vente.html': '/cgv',
    '/mentions-legales.html': '/mentions-legales',
    '/politique-de-confidentialite.html': '/confidentialite',
    '/livraison-paiment.html': '/livraison-et-paiement',
    '/sign-in.html': '/',
    '/sign-up.html': '/',
    '/no-color.html': '/boutique',
    '/details-produit.html': '/boutique',
    '/product-detail.html': '/boutique',
    '/faq.html': '/faq',
    '/about.html': '/a-propos',
    '/blog.html': '/journal',
    '/contact.html': '/contact',
    '/guide-des-tailles.html': '/guide-des-tailles',
    '/metz-2025.html': '/journal/metz-2025',
    '/la-teste-de-buch-2025.html': '/journal/la-teste-de-buch-2025',
    '/pkba-partenariat-2025.html': '/journal/pkba-partenariat-2025',
    '/accessibilite.html': '/mentions-legales',
    '/conditions-utilisation.html': '/mentions-legales',
    '/propriete-intellectuelle.html': '/mentions-legales',
  };
  const actual = Object.fromEntries(redirectMap().map((rule) => [rule.source, rule.destination]));
  assert.deepEqual(actual, expected);
  assert.ok(redirectMap().every((rule) => rule.permanent === true));
});

test('every legacy .html file still in public/ has a permanent redirect', () => {
  const publicDir = path.resolve(__dirname, '../public');
  const legacyPages = fs.readdirSync(publicDir).filter((name) => name.endsWith('.html'));
  const sources = new Set(redirectMap().map((rule) => rule.source));
  for (const page of legacyPages) {
    assert.ok(sources.has(`/${page}`), `public/${page} has no redirect and would serve the old design`);
  }
});

test('no file in public/ shadows its own redirect on the CDN', () => {
  const publicDir = path.resolve(__dirname, '../public');
  const sources = new Set(redirectMap().map((rule) => rule.source));
  const shadowing = fs.readdirSync(publicDir).filter((name) => sources.has(`/${name}`));
  assert.deepEqual(shadowing, [], `public/ files served before Next.js routing shadow their own redirect: ${shadowing.join(', ')}`);
});
