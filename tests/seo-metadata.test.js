const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

const CANONICAL_PAGES = {
  'src/app/a-propos/page.tsx': '/a-propos',
  'src/app/contact/page.tsx': '/contact',
  'src/app/commencer/page.tsx': '/commencer',
  'src/app/faq/page.tsx': '/faq',
  'src/app/guide-des-tailles/page.tsx': '/guide-des-tailles',
  'src/app/journal/page.tsx': '/journal',
  'src/app/journal/la-teste-de-buch-2025/page.mdx': '/journal/la-teste-de-buch-2025',
  'src/app/journal/metz-2025/page.mdx': '/journal/metz-2025',
  'src/app/journal/pkba-partenariat-2025/page.mdx': '/journal/pkba-partenariat-2025',
  'src/app/(legal)/cgv/page.mdx': '/cgv',
  'src/app/(legal)/confidentialite/page.mdx': '/confidentialite',
  'src/app/(legal)/livraison-et-paiement/page.mdx': '/livraison-et-paiement',
  'src/app/(legal)/mentions-legales/page.mdx': '/mentions-legales',
};

test('every French-only route declares its own canonical', () => {
  for (const [relativePath, canonical] of Object.entries(CANONICAL_PAGES)) {
    const source = read(relativePath);
    assert.ok(
      source.includes(`canonical: '${canonical}'`),
      `${relativePath} must set alternates.canonical to '${canonical}'`,
    );
  }
});

test('the root layout never sets a blanket alternates.canonical', () => {
  const source = read('src/app/layout.tsx');
  assert.doesNotMatch(source, /alternates:/, 'canonical must be per-page, not inherited from the root layout');
});

const LEGAL_PAGES = [
  'src/app/(legal)/cgv/page.mdx',
  'src/app/(legal)/confidentialite/page.mdx',
  'src/app/(legal)/livraison-et-paiement/page.mdx',
  'src/app/(legal)/mentions-legales/page.mdx',
];

test('legal pages carry a real, written description, not just a title', () => {
  for (const relativePath of LEGAL_PAGES) {
    const source = read(relativePath);
    assert.match(source, /description:\s*\n?\s*'.{20,}'/, `${relativePath} must have a written description`);
  }
});

const TRANSACTIONAL_PAGES = [
  'src/app/panier/page.tsx',
  'src/app/commande/page.tsx',
  'src/app/commande/succes/page.tsx',
  'src/app/commande/annulee/page.tsx',
];

test('transactional routes are noindexed', () => {
  for (const relativePath of TRANSACTIONAL_PAGES) {
    const source = read(relativePath);
    assert.match(source, /index:\s*false/, `${relativePath} must set robots.index to false`);
    assert.match(source, /follow:\s*false/, `${relativePath} must set robots.follow to false`);
  }
});

test('transactional routes still carry a real title and description', () => {
  for (const relativePath of TRANSACTIONAL_PAGES) {
    const source = read(relativePath);
    assert.match(source, /title:\s*'.+'/, `${relativePath} must have a title`);
    assert.match(source, /description:\s*['"].{15,}['"]/, `${relativePath} must have a written description`);
  }
});

test('the succes route stays a Server Component so it can export metadata', () => {
  const source = read('src/app/commande/succes/page.tsx');
  assert.doesNotMatch(source, /^\s*['"]use client['"]/m, 'page.tsx must not be a Client Component');
  assert.match(source, /SuccesClient/);
});

test('no llms.txt exists — the research concluded it is not worth doing', () => {
  assert.ok(!fs.existsSync(path.join(ROOT, 'public/llms.txt')));
  assert.ok(!fs.existsSync(path.join(ROOT, 'src/app/llms.txt/route.ts')));
});
