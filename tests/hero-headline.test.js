const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { dictionaries } = require('../src/lib/i18n/dictionary.ts');

const ROOT = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function isClientComponent(source) {
  return /^\s*['"]use client['"]/m.test(source);
}

test('the fr and en hero headline strings are real, non-empty sentence fragments', () => {
  for (const locale of Object.keys(dictionaries)) {
    const { headingBefore, headingAfter, headingEmphasis } = dictionaries[locale].home.hero;
    for (const fragment of [headingBefore, headingAfter, headingEmphasis]) {
      assert.equal(typeof fragment, 'string');
      assert.ok(fragment.trim().length > 0, `${locale}: heading fragment is empty`);
    }
  }
});

test('the hero headline component is a client component', () => {
  assert.ok(isClientComponent(read('src/components/motion/hero-headline.tsx')));
});

test('the home page body stays a server component and feeds the real dictionary strings into the animated headline', () => {
  const source = read('src/app/home-body.tsx');
  assert.ok(!isClientComponent(source), 'home-body.tsx must stay a Server Component so the hero renders on the server');
  assert.match(source, /<HeroHeadline\b/);
  assert.match(source, /before=\{hero\.headingBefore\}/);
  assert.match(source, /after=\{hero\.headingAfter\}/);
  assert.match(source, /emphasis=\{hero\.headingEmphasis\}/);
});

test('the hero headline renders its before/after/emphasis props directly, not from client-only state or an effect', () => {
  const source = read('src/components/motion/hero-headline.tsx');
  assert.doesNotMatch(source, /useState/, 'the headline text must not depend on client state that starts empty');
  assert.doesNotMatch(source, /fetch\(/, 'the headline text must not be fetched client-side');

  const returnBody = source.slice(source.indexOf('return ('));
  assert.match(returnBody, /\{before\}/);
  assert.match(returnBody, /\{after\}/);
  assert.match(returnBody, /\{emphasis\}/);
});

test('the hero headline never hides its text behind a default-invisible class', () => {
  const source = read('src/components/motion/hero-headline.tsx');
  assert.doesNotMatch(source, /(?<!-)\b(opacity-0|invisible|hidden)\b/);
});

test('the built home page HTML contains the full fr hero headline as real text', () => {
  const buildOutputDir = path.join(ROOT, '.next', 'server', 'app');
  if (!fs.existsSync(buildOutputDir)) {
    return;
  }

  const candidates = ['page.html', 'index.html'].map((name) => path.join(buildOutputDir, name));
  const htmlPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!htmlPath) {
    return;
  }

  const html = fs.readFileSync(htmlPath, 'utf8');
  const { headingBefore, headingAfter, headingEmphasis } = dictionaries.fr.home.hero;
  assert.ok(html.includes(headingBefore), 'built HTML is missing the fr headingBefore text');
  assert.ok(html.includes(headingAfter), 'built HTML is missing the fr headingAfter text');
  assert.ok(html.includes(headingEmphasis), 'built HTML is missing the fr headingEmphasis text');
});
