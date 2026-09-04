const test = require('node:test');
const assert = require('node:assert/strict');
const robots = require('../src/app/robots.ts').default;

test('robots allows crawling by default and points at the sitemap', () => {
  const result = robots();
  assert.equal(result.rules.userAgent, '*');
  assert.equal(result.rules.allow, '/');
  assert.equal(result.sitemap, 'https://vertiflow.fr/sitemap.xml');
});

test('robots disallows the transactional routes and the api', () => {
  const result = robots();
  assert.deepEqual(result.rules.disallow, ['/panier', '/commande', '/api/']);
});

test('robots does not disallow the orphaned legacy .html pages', () => {
  const result = robots();
  for (const disallowed of result.rules.disallow) {
    assert.ok(!disallowed.endsWith('.html'), `${disallowed} must not block a legacy page from being recrawled`);
  }
});
