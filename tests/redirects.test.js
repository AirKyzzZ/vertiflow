const test = require('node:test');
const assert = require('node:assert/strict');
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
  };
  const actual = Object.fromEntries(redirectMap().map((rule) => [rule.source, rule.destination]));
  assert.deepEqual(actual, expected);
  assert.ok(redirectMap().every((rule) => rule.permanent === true));
});

test('unported pages are not redirected', () => {
  const sources = redirectMap().map((rule) => rule.source);
  for (const path of ['/faq.html', '/blog.html', '/about.html', '/contact.html', '/guide-des-tailles.html']) {
    assert.ok(!sources.includes(path), `${path} must keep serving until its replacement exists`);
  }
});
