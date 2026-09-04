const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');

function collectSourceFiles(directory) {
  const absolute = path.join(ROOT, directory);
  if (!fs.existsSync(absolute)) return [];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(relativePath);
    return /\.(?:tsx?|jsx?)$/.test(entry.name) ? [relativePath] : [];
  });
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function isClientComponent(source) {
  return /^\s*['"]use client['"]/m.test(source);
}

test('the commerce barrel is server-only', () => {
  const barrel = read('src/lib/commerce.server.ts');
  assert.match(barrel, /import 'server-only'/);
  assert.ok(!isClientComponent(barrel), 'the barrel must never be a client component');
});

test('no client component reaches commerce code or provider credentials', () => {
  const offenders = collectSourceFiles('src')
    .filter((file) => isClientComponent(read(file)))
    .filter((file) => /commerce\.server|functions\/lib|data\/products\.json|process\.env\.(?:STRIPE|PRINTFUL|EMAILJS|VERTIFLOW)_/
      .test(read(file)));
  assert.deepEqual(offenders, []);
});

test('the migration did not modify the reviewed commerce library', () => {
  for (const file of collectSourceFiles('functions')) {
    const source = read(file);
    assert.ok(!isClientComponent(source), `${file} must stay server-side CommonJS`);
    assert.doesNotMatch(source, /from 'next\/|require\('next/, `${file} must not depend on Next.js`);
  }
});
