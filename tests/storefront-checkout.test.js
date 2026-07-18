const assert = require('node:assert/strict');
const test = require('node:test');
const { readFile } = require('node:fs/promises');
const { join } = require('node:path');
const catalogue = require('../data/products.json');

const publicFile = (file) => join(__dirname, '..', 'public', file);

test('all product pages expose unique catalogue slugs', async () => {
  const expected = new Map([
    ['tshirt-climb.html', 'tshirt-climb'],
    ['hoodie-vf-definition.html', 'hoodie-vf-definition'],
    ['shorts-performance-vf.html', 'shorts-performance-vf'],
    ['casquette-vf.html', 'casquette-vf'],
    ['cache-cou-vf.html', 'cache-cou-vf'],
    ['coque-vf.html', 'coque-iphone-vf'],
    ['debardeur-vf.html', 'debardeur-vf'],
    ['bob-vf.html', 'bob-vf'],
    ['short-confort-vf.html', 'short-confort-vf'],
  ]);

  for (const [file, slug] of expected) {
    const html = await readFile(publicFile(file), 'utf8');
    assert.match(html, new RegExp(`data-product-id="${slug}"`));
  }
});

test('product page color and size values exactly match active catalogue variants', async () => {
  const pages = new Map([
    ['tshirt-climb.html', 'tshirt-climb'],
    ['hoodie-vf-definition.html', 'hoodie-vf-definition'],
    ['shorts-performance-vf.html', 'shorts-performance-vf'],
    ['casquette-vf.html', 'casquette-vf'],
    ['cache-cou-vf.html', 'cache-cou-vf'],
    ['coque-vf.html', 'coque-iphone-vf'],
    ['debardeur-vf.html', 'debardeur-vf'],
    ['bob-vf.html', 'bob-vf'],
    ['short-confort-vf.html', 'short-confort-vf'],
  ]);

  for (const [file, slug] of pages) {
    const html = await readFile(publicFile(file), 'utf8');
    const product = catalogue.products.find((entry) => entry.slug === slug);
    const values = (attribute) => [...html.matchAll(new RegExp(`${attribute}="([^"]+)"`, 'g'))]
      .map((match) => match[1]);
    assert.deepEqual(new Set(values('data-color')), new Set(product.variants.map(({ color }) => color)), file);
    assert.deepEqual(new Set(values('data-size')), new Set(product.variants.map(({ size }) => size)), file);
  }
});

test('checkout sends canonical cart options to Custom Checkout without browser payment or email code', async () => {
  const checkout = await readFile(publicFile('checkout.html'), 'utf8');

  assert.match(checkout, /id="first-name"/);
  assert.match(checkout, /id="last-name"/);
  assert.match(checkout, /id="state"/);
  assert.match(checkout, /value="GB">United Kingdom/);
  assert.doesNotMatch(checkout, /value="UK"/);
  assert.match(checkout, /https:\/\/js\.stripe\.com\/clover\/stripe\.js/);
  assert.match(checkout, /create-checkout-session/);
  assert.match(checkout, /stripe\.initCheckout\(\{ clientSecret \}\)/);
  assert.match(checkout, /checkout\.createPaymentElement\(\)/);
  assert.match(checkout, /loadResult\.actions\.confirm\(\)/);
  assert.match(checkout, /submit-payment[^>]*disabled/);
  assert.match(checkout, /Chargement du paiement/);
  assert.match(checkout, /checkout\.on\('change'/);
  assert.match(checkout, /loadResult\.actions\.getSession\(\)/);
  assert.match(checkout, /submitButton\.disabled\s*=\s*!session\.canConfirm/);
  assert.match(checkout, /'Payer '\s*\+\s*session\.total\.total\.amount/);
  assert.doesNotMatch(checkout, /session\.total\.total\.amount\s*\/\s*100/);
  assert.doesNotMatch(checkout, /create-payment-intent/);
  assert.doesNotMatch(checkout, /emailjs/i);
  assert.doesNotMatch(checkout, /pk_(?:live|test)_/);
  assert.doesNotMatch(checkout, /JSON\.stringify\(\{\s*amount\b/);
  assert.match(checkout, /items:\s*cart\.map\(\(\{ id, color, size, quantity \}\)\s*=>\s*\(\{ slug: id, color, size, quantity \}\)\)/);
  assert.match(checkout, /checkoutState\s*=\s*'initializing'/);
  assert.match(checkout, /infoSubmitButton\.disabled\s*=\s*true/);
  assert.match(checkout, /localStorage\.setItem\('pendingCheckoutSessionId', payload\.sessionId\)/);
  assert.doesNotMatch(checkout, /text\/plain/);
  assert.doesNotMatch(checkout, /\.append\(\s*[`'"]\s*</);
  assert.match(checkout, /document\.createElement\(/);
  assert.match(checkout, /\.textContent\s*=/);
  assert.match(checkout, /isLegacyCart/);
});

test('storefront cart preserves display price separately from the canonical product slug', async () => {
  const custom = await readFile(publicFile('js/custom.js'), 'utf8');

  assert.match(custom, /id:\s*productId/);
  assert.match(custom, /displayPrice:\s*productPrice/);
  assert.doesNotMatch(custom, /\bprice:\s*productPrice/);
});

test('success clears the cart only after the exact pending Checkout Session id returns', async () => {
  const success = await readFile(publicFile('success.html'), 'utf8');

  assert.match(success, /URLSearchParams/);
  assert.match(success, /localStorage\.getItem\('pendingCheckoutSessionId'\)/);
  assert.match(success, /sessionId\s*!==\s*pendingSessionId/);
  assert.match(success, /localStorage\.removeItem\('cart'\)/);
  assert.match(success, /localStorage\.removeItem\('pendingCheckoutSessionId'\)/);
  assert.match(success, /Paiement en attente de confirmation/);
  assert.match(success, /get-checkout-session/);
  assert.match(success, /status\s*!==\s*'complete'/);
  assert.match(success, /paymentStatus\s*!==\s*'paid'/);
  assert.doesNotMatch(success, /no_payment_required/);
});
