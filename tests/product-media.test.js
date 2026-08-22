const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { productMedia, mediaFor, heroFor } = require('../src/lib/product-media.ts');
const catalogue = require('../data/products.json');

test('every catalogue slug and colour has media', () => {
  for (const product of catalogue.products) {
    const colours = [...new Set(product.variants.filter((v) => v.active).map((v) => v.color))];
    for (const colour of colours) {
      const images = mediaFor(product.slug, colour);
      assert.ok(images.length > 0, `${product.slug} / ${colour} has no media`);
    }
  }
});

test('every mapped path exists on disk', () => {
  for (const [slug, byColour] of Object.entries(productMedia)) {
    for (const [colour, images] of Object.entries(byColour)) {
      for (const image of images) {
        const onDisk = path.join(__dirname, '..', 'public', image);
        assert.ok(fs.existsSync(onDisk), `${slug}/${colour}: missing ${image}`);
      }
    }
  }
});

test('no mapped path points at the printful cdn or an artwork file', () => {
  for (const byColour of Object.values(productMedia)) {
    for (const images of Object.values(byColour)) {
      for (const image of images) {
        assert.ok(image.startsWith('/images/product/'), `${image} must be a local path`);
      }
    }
  }
});

test('mediaFor falls back to the first colour for an unknown colour', () => {
  assert.deepEqual(mediaFor('bob-vf', 'Rouge'), mediaFor('bob-vf', 'Blanc'));
});

test('mediaFor returns empty for an unknown slug', () => {
  assert.deepEqual(mediaFor('does-not-exist', 'Noir'), []);
});

test('heroFor returns the first image', () => {
  assert.equal(heroFor('tshirt-climb', 'Noir'), mediaFor('tshirt-climb', 'Noir')[0]);
});

test('each colourway holds at most four images', () => {
  for (const byColour of Object.values(productMedia)) {
    for (const images of Object.values(byColour)) {
      assert.ok(images.length <= 4);
    }
  }
});

test('no component reads image_url or coverImage', () => {
  const root = path.join(__dirname, '..', 'src');
  const offenders = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!/\.(ts|tsx)$/.test(entry.name)) continue;
      const source = fs.readFileSync(full, 'utf8');
      if (/\bcoverImage\b/.test(source)) offenders.push(`${full}: coverImage`);
      if (/\.image_url\b/.test(source)) offenders.push(`${full}: image_url`);
    }
  };
  walk(root);
  assert.deepEqual(offenders, [], `product imagery must come from product-media.ts:\n${offenders.join('\n')}`);
});
