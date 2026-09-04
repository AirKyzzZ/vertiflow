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
  assert.doesNotMatch(source, /useEffect/, 'the headline text must not depend on an effect');
  assert.doesNotMatch(source, /fetch\(/, 'the headline text must not be fetched client-side');

  assert.match(source, /\{before\}/);
  assert.match(source, /\{after\}/);
  assert.match(source, /\{emphasis\}/);
});

test('the hero headline is split by line via data-hero-line, never by character', () => {
  const source = read('src/components/motion/hero-headline.tsx');
  const lineMatches = source.match(/data-hero-line/g) || [];
  assert.ok(lineMatches.length >= 2, 'expected at least one data-hero-line marker per headline line');
  assert.doesNotMatch(source, /by="character"/, 'the headline must never split its text per character');
});

test('the accent word keeps the text-accent token', () => {
  const source = read('src/components/motion/hero-headline.tsx');
  assert.match(source, /text-accent/);
});

test('reduced motion is resolved by a CSS media variant, not a client branch that could mismatch the server render', () => {
  const source = read('src/components/motion/hero-headline.tsx');
  assert.doesNotMatch(source, /useReducedMotion/, 'reduced motion must not depend on a client-only hook the server cannot pre-resolve');
  assert.match(source, /motion-reduce:hidden/, 'the animated tree must hide itself under reduced motion');
  assert.match(source, /hidden motion-reduce:block/, 'the static fallback must appear under reduced motion');
});

test('the built home page HTML contains the full fr hero headline as real text, split into data-hero-line elements', () => {
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

  const lineCount = (html.match(/data-hero-line/g) || []).length;
  assert.ok(lineCount >= 2, 'built HTML is missing data-hero-line markers');
});
