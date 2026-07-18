# VertiFlow Commerce Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn every paid VertiFlow checkout into the correct unconfirmed Printful draft, send the customer and owner emails automatically, and remove browser authority over products and prices.

**Architecture:** A committed nine-product commercial catalogue groups fifteen allowlisted Printful sync products and maps 107 public option combinations to exact sync variant IDs. Stripe Checkout Sessions use approved Stripe Prices and versioned provenance metadata; the verified webhook validates the paid historical facts, creates an idempotent Printful draft, and sends two server-side EmailJS templates. Printful production always retains Maxime's manual confirmation gate.

**Tech Stack:** Node.js CommonJS, Node test runner, Netlify Functions, static HTML/jQuery, Stripe Checkout Sessions and Stripe.js Custom Checkout, Printful Orders API, EmailJS REST API.

## Global Constraints

- The live storefront names and prices are authoritative; Printful retail prices are never charged.
- Exactly nine commercial products and fifteen allowlisted Printful sync products are sellable in this phase.
- PKBA, Kenzi, generic `Débardeur`, and every unrelated Printful product remain untouched and unpurchasable.
- Every public `product + color + size` combination resolves to exactly one active Printful `sync_variant_id`.
- Unknown, inactive, duplicated, or ambiguous mappings fail before payment.
- A verified paid Stripe Checkout Session is the only event allowed to create a Printful draft.
- Test Checkout requires a private integration-access token, and the webhook requires the
  resulting versioned Session authorization marker before any real Printful or email side effect.
  Token rotation preserves authorized retries, and live Stripe mode is rejected.
- Printful orders use `confirm: false` and a deterministic 32-character `vf_` external ID derived from the Checkout Session ID's SHA-256 digest. The full Session ID remains in Stripe and the owner email.
- Email is sent from `vertiflow.pro@gmail.com` through EmailJS after the verified webhook runs.
- Automatic Printful confirmation, Instagram automation, PKBA products, and a new email provider are out of scope.
- Do not stage or modify `.DS_Store`, `public/.DS_Store`, or `automation/`.
- `package.json`, `package-lock.json`, and `netlify.toml` changes require Maxime's explicit approval before execution.

## Implementation status (2026-07-18)

- [x] Tasks 1-6 repository code and automated contracts are implemented.
- [x] Task 7 repository configuration, runtime pins, environment contract, and runbook are implemented.
- [ ] Real-browser Netlify Dev checkout and provider smoke matrix remain pending.
- [ ] Production webhook creation, live catalogue promotion, live order, and every Printful confirmation remain pending explicit approval.

The detailed steps below preserve the original TDD implementation record. Each task's
status line is authoritative; provider-facing steps remain unchecked even when their
supporting code and automated doubles are complete.

---

## File Structure

- `data/storefront-products.json`: hand-reviewed commercial product definitions, authoritative prices, and allowed Printful product IDs.
- `data/products.json`: generated deployable catalogue containing exact variants and Stripe IDs.
- `data/products.schema.json`: schema for the generated catalogue.
- `scripts/lib/printful-catalogue.js`: Printful retrieval and commercial catalogue construction.
- `scripts/lib/stripe-catalogue.js`: Stripe Product and Price reconciliation using storefront prices.
- `functions/lib/catalogue.js`: runtime cart validation and variant lookup.
- `functions/lib/checkout-provenance.js`: canonical Checkout v1 tuples, digest, and metadata.
- `functions/lib/printful-orders.js`: Printful draft creation, lookup, and response validation.
- `functions/lib/emailjs.js`: server-side customer and owner email delivery.
- `functions/create-checkout-session.js`: secure Checkout Session creation.
- `functions/create-payment-intent.js`: disabled legacy endpoint.
- `functions/stripe-webhook.js`: verified paid-order orchestration.
- `public/js/custom.js`: records catalogue slugs and public options in the cart.
- `public/checkout.html`: customer details and Stripe Custom Checkout UI.
- `public/success.html`: clears the paid cart after returning from Stripe.
- `tests/*.test.js`: catalogue, Stripe, checkout, Printful, email, webhook, and static storefront contracts.

---

### Task 1: Curate and validate the nine-product catalogue

**Status:** Repository implementation and automated validation complete. No Printful sync is rerun by this final release-hygiene task.

**Files:**
- Create: `data/storefront-products.json`
- Modify: `data/products.schema.json`
- Modify: `scripts/lib/printful-catalogue.js`
- Modify: `scripts/sync-printful-catalogue.js`
- Modify: `tests/printful-catalogue.test.js`
- Create: `tests/storefront-catalogue.test.js`
- Regenerate: `data/products.json`

**Interfaces:**
- Consumes: Printful `/store/products`, `/store/products/{id}`, and `/products/variant/{id}` responses.
- Produces: `buildCommercialCatalogue({ config, productDetails, catalogVariants, existingCatalogue, generatedAt }) -> CatalogueV2`.
- Produces: products with `slug`, `name`, `price`, `printful_sync_product_ids`, `stripe_product_id`, and variants with `color`, `size`, `printful_sync_product_id`, `printful_sync_variant_id`, `stripe_price_id`, and `active`.

- [x] **Step 1: Write the failing commercial configuration test**

```js
const assert = require('node:assert/strict');
const test = require('node:test');
const config = require('../data/storefront-products.json');

test('commercial config contains only the approved VertiFlow products', () => {
  assert.equal(config.products.length, 9);
  assert.deepEqual(
    config.products.map(({ slug, price }) => [slug, price]),
    [
      ['tshirt-climb', '29.99'],
      ['hoodie-vf-definition', '64.99'],
      ['casquette-vf', '29.99'],
      ['shorts-performance-vf', '47.99'],
      ['coque-iphone-vf', '29.99'],
      ['debardeur-vf', '19.99'],
      ['cache-cou-vf', '24.99'],
      ['bob-vf', '24.99'],
      ['short-confort-vf', '29.99'],
    ],
  );
  const ids = config.products.flatMap((product) =>
    product.sources.map((source) => source.printful_sync_product_id));
  assert.deepEqual(ids.sort((a, b) => a - b), [
    376170525, 376418591, 376418706, 376418808, 376418868,
    376418913, 377330919, 377337480, 377338525, 377338630,
    377417508, 385121662, 385122205, 385122974, 385123410,
  ]);
});
```

- [x] **Step 2: Run the test and verify it fails because the config does not exist**

Run: `node --test tests/storefront-catalogue.test.js`

Expected: FAIL with `Cannot find module '../data/storefront-products.json'`.

- [x] **Step 3: Add the complete hand-reviewed configuration**

```json
{
  "schema_version": 1,
  "currency": "EUR",
  "products": [
    { "slug": "tshirt-climb", "name": "T-shirt CLIMB", "price": "29.99", "sources": [
      { "printful_sync_product_id": 376170525, "color": "Noir" },
      { "printful_sync_product_id": 377330919, "color": "Blanc" }
    ] },
    { "slug": "hoodie-vf-definition", "name": "Hoodie VF Definition", "price": "64.99", "sources": [
      { "printful_sync_product_id": 376418591, "color": "Noir" },
      { "printful_sync_product_id": 377337480, "color": "Blanc" }
    ] },
    { "slug": "casquette-vf", "name": "Casquette VF", "price": "29.99", "sources": [
      { "printful_sync_product_id": 376418706, "color": "Noir" },
      { "printful_sync_product_id": 377338630, "color": "Blanc" }
    ] },
    { "slug": "shorts-performance-vf", "name": "Shorts Performance VF", "price": "47.99", "sources": [
      { "printful_sync_product_id": 376418808, "color": "Noir" },
      { "printful_sync_product_id": 377338525, "color": "Blanc" }
    ] },
    { "slug": "coque-iphone-vf", "name": "Coque iPhone VF", "price": "29.99", "sources": [
      { "printful_sync_product_id": 377417508, "color": "Noir" },
      { "printful_sync_product_id": 376418868, "color": "Blanc" }
    ] },
    { "slug": "debardeur-vf", "name": "Débardeur VF", "price": "19.99", "sources": [
      { "printful_sync_product_id": 385121662, "color": "Noir" },
      { "printful_sync_product_id": 385122205, "color": "Blanc" }
    ] },
    { "slug": "cache-cou-vf", "name": "Cache-cou VF", "price": "24.99", "sources": [
      { "printful_sync_product_id": 376418913, "color": "Noir", "size_aliases": { "One size": "M" } }
    ] },
    { "slug": "bob-vf", "name": "Bob VF", "price": "24.99", "sources": [
      { "printful_sync_product_id": 385122974, "color": "Blanc", "size_aliases": { "One size": "M" } }
    ] },
    { "slug": "short-confort-vf", "name": "Short Confort VF", "price": "29.99", "sources": [
      { "printful_sync_product_id": 385123410, "color": "Blanc" }
    ] }
  ]
}
```

- [x] **Step 4: Add failing tests for grouping, aliases, exclusion, and exact cardinality**

```js
const catalogue = require('../data/products.json');
const config = require('../data/storefront-products.json');

test('generated catalogue contains nine approved products and 107 public variants', () => {
  assert.equal(catalogue.schema_version, 2);
  assert.equal(catalogue.products.length, 9);
  assert.equal(catalogue.products.flatMap((product) => product.variants).length, 107);
  assert.equal(catalogue.products.some((product) => /pkba|kenzi/i.test(product.name)), false);
  const bob = catalogue.products.find((product) => product.slug === 'bob-vf');
  assert.equal(bob.variants[0].size, 'M');
  assert.equal(bob.variants[0].printful_size, 'One size');
});

test('buildCommercialCatalogue fails when an allowlisted source is missing', () => {
  const summaries = config.products
    .flatMap((product) => product.sources)
    .filter((source) => source.printful_sync_product_id !== 385122974)
    .map((source) => ({ id: source.printful_sync_product_id }));
  assert.throws(
    () => validateAllowlistedProducts(config, summaries),
    /Missing allowlisted Printful product 385122974/,
  );
});
```

- [x] **Step 5: Implement commercial grouping and fail-closed validation**

Implement `validateAllowlistedProducts(config, summaries)` and `buildCommercialCatalogue` so the builder uses config order, forces the configured public color, applies `size_aliases`, preserves Stripe IDs by `printful_sync_variant_id`, rejects duplicate public option keys, and never copies Printful retail price into `product.price`.

Core mapping logic:

```js
const publicSize = source.size_aliases?.[catalogVariant.size] ?? catalogVariant.size;
const optionKey = `${source.color}\u0000${publicSize}`;
if (usedOptions.has(optionKey)) {
  throw new Error(`Duplicate public option ${productConfig.slug}: ${source.color} / ${publicSize}`);
}
usedOptions.add(optionKey);
return {
  color: source.color,
  size: publicSize,
  printful_color: catalogVariant.color ?? null,
  printful_size: catalogVariant.size ?? null,
  printful_sync_product_id: source.printful_sync_product_id,
  printful_sync_variant_id: Number(syncVariant.id),
  printful_catalog_variant_id: Number(syncVariant.variant_id),
  stripe_price_id: existingVariant?.stripe_price_id ?? null,
  image_url: pickImageUrl(syncVariant, catalogVariant, syncProduct),
  active: syncVariant.synced !== false && syncVariant.is_ignored !== true,
};
```

- [x] **Step 6: Update the schema and synchronizer, then generate the catalogue**

The schema must require `schema_version: 2`, product-level `price`, product-level `printful_sync_product_ids`, and variant-level source IDs and public/Printful options. `sync-printful-catalogue.js` must load `data/storefront-products.json`, fetch details only for its fifteen IDs, refuse partial output, and atomically write `data/products.json`.

Run: `PRINTFUL_STORE_ID=15558986 node scripts/sync-printful-catalogue.js`

Expected: `Synced 9 commercial products and 107 active variants`.

- [x] **Step 7: Run focused and full tests**

Run: `node --test tests/printful-catalogue.test.js tests/storefront-catalogue.test.js`

Expected: PASS.

Run: `node --test tests/*.test.js`

Expected: all tests PASS.

- [x] **Step 8: Commit**

```bash
git add data/storefront-products.json data/products.json data/products.schema.json scripts/lib/printful-catalogue.js scripts/sync-printful-catalogue.js tests/printful-catalogue.test.js tests/storefront-catalogue.test.js
git commit -m "feat: curate VertiFlow product catalogue"
```

---

### Task 2: Reconcile Stripe Prices from storefront prices

**Status:** Reconciliation code, test-key guard, and committed catalogue IDs complete. Provider reconciliation is not rerun by this final release-hygiene task.

**Files:**
- Modify: `scripts/lib/stripe-catalogue.js`
- Modify: `tests/stripe-catalogue.test.js`
- Modify: `scripts/sync-stripe-prices.js`

**Interfaces:**
- Consumes: CatalogueV2 from Task 1.
- Produces: one Stripe Product per commercial product and one deterministic Stripe Price per active public variant.
- Preserves: `stripe_product_id` and `variant.stripe_price_id` in `data/products.json`.

- [x] **Step 1: Change the fixture to make Printful and storefront prices disagree**

```js
const product = {
  slug: 'hoodie-vf-definition',
  name: 'Hoodie VF Definition',
  price: '64.99',
  printful_sync_product_ids: [376418591, 377337480],
  variants: [{
    color: 'Noir',
    size: 'M',
    printful_retail_price: '54.99',
    printful_sync_product_id: 376418591,
    printful_sync_variant_id: 9001,
    printful_catalog_variant_id: 4012,
    stripe_price_id: null,
    active: true,
  }],
};
```

Assert `prices.create.unit_amount === 6499`, never `5499`, and assert the Stripe Product metadata contains `commercial_slug` while Price metadata contains the exact sync product and variant IDs.

- [x] **Step 2: Run the test and verify it fails on the old retail-price field**

Run: `node --test tests/stripe-catalogue.test.js`

Expected: FAIL because `priceInMinorUnits` receives an undefined retail price or creates `5499`.

- [x] **Step 3: Use product-level authoritative prices and commercial lookup keys**

```js
function priceLookupKey(productSlug, syncVariantId, currency) {
  return `vertiflow_${productSlug}_${syncVariantId}_${currency.toLowerCase()}`;
}

const unitAmount = priceInMinorUnits(product.price);
const lookupKey = priceLookupKey(product.slug, variant.printful_sync_variant_id, currency);
```

Use `commercial_slug` to find existing Stripe Products rather than a single Printful product ID. Retain immutable price replacement with `transfer_lookup_key`, and archive replaced Prices.

- [x] **Step 4: Run focused and full tests**

Run: `node --test tests/stripe-catalogue.test.js`

Expected: PASS.

Run: `node --test tests/*.test.js`

Expected: all tests PASS.

- [ ] **Step 5: Reconcile only against a Stripe test key**

Run with a minimum-permission restricted test key: `STRIPE_SECRET_KEY=rk_test_... node scripts/sync-stripe-prices.js`. The script itself rejects missing or live keys before constructing Stripe.

Expected: `Reconciled 9 products and 107 Stripe prices` and every active variant has a Stripe Price ID beginning with `price_`. Do not set `ALLOW_LIVE_STRIPE_SYNC` in this task.

- [x] **Step 6: Commit**

```bash
git add data/products.json scripts/lib/stripe-catalogue.js scripts/sync-stripe-prices.js tests/stripe-catalogue.test.js
git commit -m "feat: reconcile authoritative Stripe prices"
```

---

### Task 3: Create server-authoritative Checkout Sessions

**Status:** Repository implementation and automated validation complete.

**Files:**
- Create: `functions/lib/catalogue.js`
- Create: `functions/create-checkout-session.js`
- Modify: `functions/create-payment-intent.js`
- Create: `tests/catalogue-runtime.test.js`
- Create: `tests/create-checkout-session.test.js`
- Modify with explicit approval: `package.json`
- Modify with explicit approval: `package-lock.json`

**Interfaces:**
- Produces: `resolveCart(catalogue, items) -> ResolvedLine[]`.
- `ResolvedLine`: `{ priceId, stripeProductId, currency, unitAmount, slug, syncProductId, syncVariantId, catalogVariantId, quantity, name, color, size }`.
- Produces: `checkoutMetadata(resolvedLines, mode) -> { vf_checkout_version, vf_checkout_sha256, vf_line_count, vf_livemode }`.
- Produces: `validateCustomer(customer) -> { firstName, lastName, email, phone, address }`.
- Produces: `createCheckoutHandler({ stripe, catalogue, environment }) -> NetlifyHandler`.
- Checkout request: `{ items: [{ slug, color, size, quantity }], customer, promoCode }`.
- Checkout response: `{ clientSecret, sessionId, publishableKey }`; the public key comes from `STRIPE_PUBLISHABLE_KEY` so test and live modes cannot be mixed.

- [x] **Step 1: Obtain approval and upgrade Stripe SDK**

Update `stripe` from `^17.6.0` to `^22.3.2` and add:

```json
"scripts": {
  "test": "node --test tests/*.test.js"
}
```

Run: `npm install stripe@^22.3.2`

Expected: `package.json` and `package-lock.json` change; `npm test` invokes the Node test runner. Stripe 18+ is required for Checkout Sessions `ui_mode: "custom"`.

- [x] **Step 2: Write failing cart authority tests**

```js
test('resolveCart ignores browser prices and returns approved Stripe prices', () => {
  const catalogue = {
    currency: 'EUR',
    products: [{
      slug: 'hoodie-vf-definition',
      name: 'Hoodie VF Definition',
      price: '64.99',
      active: true,
      stripe_product_id: 'prod_test_hoodie',
      variants: [{
        color: 'Noir',
        size: 'M',
        active: true,
        stripe_price_id: 'price_test_hoodie_black_m',
        printful_sync_product_id: 376418591,
        printful_sync_variant_id: 9001,
        printful_catalog_variant_id: 4012,
      }],
    }],
  };
  const result = resolveCart(catalogue, [{
    slug: 'hoodie-vf-definition', color: 'Noir', size: 'M', quantity: 2, price: 0.01,
  }]);
  assert.deepEqual(result, [{
    priceId: 'price_test_hoodie_black_m',
    stripeProductId: 'prod_test_hoodie',
    currency: 'eur',
    unitAmount: 6499,
    slug: 'hoodie-vf-definition',
    syncProductId: 376418591,
    syncVariantId: 9001,
    catalogVariantId: 4012,
    quantity: 2,
    name: 'Hoodie VF Definition',
    color: 'Noir',
    size: 'M',
  }]);
});

test('resolveCart rejects unknown and inactive options', () => {
  const catalogue = { products: [] };
  assert.throws(
    () => resolveCart(catalogue, [{ slug: 'pkba-shorts', color: 'Blanc', size: 'M', quantity: 1 }]),
    /Unknown catalogue option/,
  );
});
```

- [x] **Step 3: Implement strict runtime catalogue lookup**

`resolveCart` must reject empty carts, more than 100 lines, quantities outside integer `1..10`, missing Stripe IDs, inactive variants, and duplicate catalogue options. It returns only canonical Stripe and Printful identifiers.

- [x] **Step 4: Write a failing Checkout Session handler test**

```js
test('handler creates custom Checkout from canonical line items and native shipping', async () => {
  const calls = [];
  const stripe = {
    checkout: { sessions: { create: async (params) => {
      calls.push(params);
      return { id: 'cs_test_123', client_secret: 'cs_test_secret' };
    } } },
  };
  const catalogue = completeCatalogueFixture();
  const environment = {
    SITE_URL: 'https://vertiflow.fr',
    STRIPE_SECRET_KEY: 'rk_test_example',
    STRIPE_PUBLISHABLE_KEY: 'pk_test_example',
    STRIPE_SHIPPING_RATE_ID: 'shr_test_standard',
  };
  const event = {
    httpMethod: 'POST',
    body: JSON.stringify({
      items: [{ slug: 'hoodie-vf-definition', color: 'Noir', size: 'M', quantity: 1 }],
      customer: {
        firstName: 'Léa',
        lastName: 'Martin',
        email: 'lea@example.com',
        phone: '',
        address: {
          line1: '1 rue du Test', line2: '', city: 'Bordeaux',
          postal_code: '33000', country: 'FR', state: '',
        },
      },
      promoCode: '',
    }),
  };
  const response = await createCheckoutHandler({ stripe, catalogue, environment })(event);
  assert.equal(response.statusCode, 200);
  const params = calls[0];
  assert.equal(params.ui_mode, 'custom');
  assert.deepEqual(params.line_items, [{ price: 'price_test_hoodie_black_m', quantity: 1 }]);
  assert.equal(params.payment_intent_data.shipping.address.country, 'FR');
  assert.equal(params.shipping_options[0].shipping_rate, 'shr_test_standard');
  assert.equal('amount' in params, false);
  assert.equal(JSON.parse(response.body).publishableKey, 'pk_test_example');
});
```

- [x] **Step 5: Implement Checkout Session creation**

Create the Session with:

```js
{
  ui_mode: 'custom',
  mode: 'payment',
  line_items: resolvedItems.map(({ priceId, quantity }) => ({ price: priceId, quantity })),
  customer_email: customer.email,
  return_url: `${environment.SITE_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
  shipping_options: [{ shipping_rate: environment.STRIPE_SHIPPING_RATE_ID }],
  payment_intent_data: {
    shipping: {
      name: `${customer.firstName} ${customer.lastName}`,
      phone: customer.phone || undefined,
      address: customer.address,
    },
  },
  metadata: {
    first_name: customer.firstName,
    last_name: customer.lastName,
    phone: customer.phone || '',
    fulfillment_status: 'awaiting_payment',
    ...checkoutMetadata(resolvedItems, mode),
  },
}
```

Return `session.client_secret`, `session.id`, and `environment.STRIPE_PUBLISHABLE_KEY`; reject configuration where the publishable and secret keys are from different Stripe modes.

If `promoCode` matches `VERTIFLOW_PROMO_CODE`, add the configured `STRIPE_PROMOTION_CODE_ID`; otherwise reject a non-empty invalid code. Require ISO country `GB` rather than `UK`, and require a state for US, CA, and AU addresses.

- [x] **Step 6: Disable the vulnerable legacy endpoint**

Replace `create-payment-intent.js` with a handler returning HTTP 410 and `{ "error": "Checkout endpoint replaced" }`. Do not leave any path that accepts a browser amount.

- [x] **Step 7: Run focused and full tests**

Run: `node --test tests/catalogue-runtime.test.js tests/create-checkout-session.test.js`

Expected: PASS.

Run: `npm test`

Expected: all tests PASS.

- [x] **Step 8: Commit**

```bash
git add package.json package-lock.json functions/lib/catalogue.js functions/create-checkout-session.js functions/create-payment-intent.js tests/catalogue-runtime.test.js tests/create-checkout-session.test.js
git commit -m "fix: enforce server-authoritative checkout"
```

---

### Task 4: Wire the storefront to Stripe Custom Checkout

**Status:** Storefront code and static automated contracts complete. The real-browser Netlify Dev payment smoke test remains pending.

**Files:**
- Modify: `public/js/custom.js`
- Modify: `public/checkout.html`
- Modify: `public/success.html`
- Modify: `public/tshirt-climb.html`
- Modify: `public/hoodie-vf-definition.html`
- Modify: `public/shorts-performance-vf.html`
- Modify: `public/casquette-vf.html`
- Modify: `public/cache-cou-vf.html`
- Modify: `public/coque-vf.html`
- Modify: `public/debardeur-vf.html`
- Modify: `public/bob-vf.html`
- Modify: `public/short-confort-vf.html`
- Create: `tests/storefront-checkout.test.js`

**Interfaces:**
- Consumes: Task 3 request and response shapes.
- Produces cart lines: `{ slug, name, displayPrice, size, color, quantity, image }`.
- Uses Stripe.js `clover` build, `stripe.initCheckout`, `checkout.createPaymentElement`, and `actions.confirm`.

- [x] **Step 1: Write failing static storefront contract tests**

```js
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
    const html = await readFile(`public/${file}`, 'utf8');
    assert.match(html, new RegExp(`data-product-id="${slug}"`));
  }
});
```

Also assert checkout has `first-name`, `last-name`, ISO country values, no EmailJS browser script, no browser `amount`, and no call to `create-payment-intent`.

- [x] **Step 2: Run the test and verify duplicated numeric IDs and old endpoint fail**

Run: `node --test tests/storefront-checkout.test.js`

Expected: FAIL on numeric `data-product-id` and `create-payment-intent`.

- [x] **Step 3: Replace numeric product IDs with the nine exact slugs**

Change each page according to the map in Step 1. Update `custom.js` to store `slug` and treat the HTML price as display-only.

- [x] **Step 4: Replace browser payment and email code**

Use:

```js
const response = await fetch('/.netlify/functions/create-checkout-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    items: cart.map(({ id, color, size, quantity }) => ({ slug: id, color, size, quantity })),
    customer,
    promoCode: $('#promo-code').val().trim(),
  }),
});
const { clientSecret, publishableKey } = await response.json();
const stripe = Stripe(publishableKey);
const checkout = stripe.initCheckout({ clientSecret });
const paymentElement = checkout.createPaymentElement();
paymentElement.mount('#payment-element');
const loadResult = await checkout.loadActions();
if (loadResult.type !== 'success') throw new Error('Paiement indisponible');
checkout.on('change', (session) => {
  submitButton.disabled = !session.canConfirm;
  submitButton.textContent = `Payer ${(session.total.total.amount / 100).toFixed(2)} €`;
});
submitButton.onclick = async () => {
  const result = await loadResult.actions.confirm();
  if (result.type === 'error') showCheckoutError(result.error.message);
};
```

Load `https://js.stripe.com/clover/stripe.js`. Split first and last name fields, send country option values, add a region field required for US/CA/AU, fix `UK` to `GB`, and remove all EmailJS browser code.

- [x] **Step 5: Clear the cart only on a returned Checkout Session**

On `success.html`, read `session_id`; if it begins with `cs_`, remove `cart` from local storage. Do not clear the cart before Stripe redirects back.

- [x] **Step 6a: Run automated storefront and full tests**

Run: `node --test tests/storefront-checkout.test.js && npm test`

Expected: PASS.

- [ ] **Step 6b: Run the local browser smoke test**

Run the site through Netlify Dev, add one black T-shirt size M, reach the Stripe test Payment Element, and confirm the server response total is 36.98 EUR including 6.99 EUR shipping.

- [x] **Step 7: Commit**

```bash
git add public/js/custom.js public/checkout.html public/success.html public/tshirt-climb.html public/hoodie-vf-definition.html public/shorts-performance-vf.html public/casquette-vf.html public/cache-cou-vf.html public/coque-vf.html public/debardeur-vf.html public/bob-vf.html public/short-confort-vf.html tests/storefront-checkout.test.js
git commit -m "feat: connect storefront to secure Checkout"
```

---

### Task 5: Create and validate unconfirmed Printful drafts

**Status:** Client, validation, idempotency, timeout, and mismatch behavior are complete under automated tests. Representative provider drafts remain pending.

**Files:**
- Create: `functions/lib/printful-orders.js`
- Create: `tests/printful-orders.test.js`

**Interfaces:**
- Produces: `PrintfulOrdersClient({ apiKey, storeId, fetchImpl })`.
- Produces: `createOrGetDraft({ externalId, recipient, items }) -> PrintfulOrder`.
- Produces: `validateDraft({ expected, actual }) -> void`.
- Item shape: `{ sync_variant_id, quantity }`.

- [x] **Step 1: Write failing request, idempotency, and mismatch tests**

```js
test('createOrGetDraft creates an unconfirmed order in the VertiFlow store', async () => {
  let request;
  const fetchImpl = async (url, options) => {
    request = { url: new URL(url), options };
    return new Response(JSON.stringify({
      code: 200,
      result: {
        id: 987,
        external_id: 'vf_01234567890123456789012345678',
        status: 'draft',
        items: [{ sync_variant_id: 501, quantity: 2 }],
      },
    }), { status: 200 });
  };
  const client = new PrintfulOrdersClient({ apiKey: 'token', storeId: 15558986, fetchImpl });
  const order = await client.createOrGetDraft({
    externalId: 'vf_01234567890123456789012345678',
    recipient: {
      name: 'Léa Martin', address1: '1 rue du Test', city: 'Bordeaux',
      zip: '33000', country_code: 'FR', email: 'lea@example.com',
    },
    items: [{ sync_variant_id: 501, quantity: 2 }],
  });
  assert.equal(request.url.searchParams.get('confirm'), 'false');
  assert.equal(request.url.searchParams.get('update_existing'), 'true');
  assert.equal(request.options.headers['X-PF-Store-Id'], '15558986');
  assert.equal(order.status, 'draft');
});

test('validateDraft rejects the wrong variant or quantity', () => {
  assert.throws(
    () => validateDraft({
      expected: [{ sync_variant_id: 501, quantity: 2 }],
      actual: [{ sync_variant_id: 999, quantity: 2 }],
    }),
    /Printful draft mismatch/,
  );
});
```

- [x] **Step 2: Run and verify missing module failure**

Run: `node --test tests/printful-orders.test.js`

Expected: FAIL with `Cannot find module '../functions/lib/printful-orders'`.

- [x] **Step 3: Implement the Printful Orders client**

POST `/orders?confirm=false&update_existing=true` with `external_id`, `recipient`, and exact `sync_variant_id` items. On a duplicate/existing order response, GET `/orders/@{externalId}` and validate it. Classify HTTP 408, 429, and 5xx as retryable; classify invalid address, missing variant, and other 4xx responses as permanent.

Normalize expected and actual lines to sorted arrays of `[sync_variant_id, quantity]` before comparing. Reject any returned status other than `draft` or `failed`; never call `/confirm`.

- [x] **Step 4: Run focused and full tests**

Run: `node --test tests/printful-orders.test.js && npm test`

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add functions/lib/printful-orders.js tests/printful-orders.test.js
git commit -m "feat: create safe Printful draft orders"
```

---

### Task 6: Send server-side emails and orchestrate the paid webhook

**Status:** Repository implementation and automated webhook/email state-machine coverage complete. Real Stripe, Printful, and EmailJS smoke tests remain pending.

**Files:**
- Create: `functions/lib/emailjs.js`
- Modify: `functions/stripe-webhook.js`
- Create: `tests/emailjs.test.js`
- Create: `tests/stripe-webhook.test.js`

**Interfaces:**
- Produces: `EmailJsClient({ serviceId, publicKey, privateKey, customerTemplateId, ownerTemplateId, fetchImpl })`.
- Produces: `sendCustomerConfirmation(order) -> Promise<void>`.
- Produces: `sendOwnerReview(order) -> Promise<void>`.
- Produces: `createWebhookHandler({ stripe, printful, email, webhookSecret }) -> NetlifyHandler`.
- Consumes Checkout provenance v1 metadata and expanded Stripe Price/Product facts; missing or mismatched provenance fails closed.
- Derives `printfulExternalId = "vf_" + sha256(session.id).base64url.slice(0, 29)` while retaining the full Session ID in Stripe and the owner email.
- Trust boundary: provenance detects accidental/out-of-band mutation, while privileged Stripe-account writers remain trusted because they can replace both facts and metadata.

- [x] **Step 1: Write failing customer and owner template tests**

```js
let request;
const fetchImpl = async (url, options) => {
  request = { url, options };
  return new Response('OK', { status: 200 });
};
const client = new EmailJsClient({
  serviceId: 'service_test',
  publicKey: 'public_test',
  privateKey: 'private_test',
  customerTemplateId: 'template_customer',
  ownerTemplateId: 'template_owner',
  fetchImpl,
});
const order = {
  firstName: 'Léa',
  lastName: 'Martin',
  customerEmail: 'lea@example.com',
  printfulOrderId: 987,
  lines: [{
    name: 'T-shirt CLIMB', color: 'Noir', size: 'M',
    quantity: 1, syncVariantId: 501,
  }],
};

test('customer email uses the approved French copy and customer recipient', async () => {
  await client.sendCustomerConfirmation(order);
  const body = JSON.parse(request.options.body);
  assert.equal(body.template_params.to_email, 'lea@example.com');
  assert.equal(body.template_params.first_name, 'Léa');
  assert.equal(body.template_params.last_name, 'Martin');
  assert.match(body.template_params.message, /7-10 jours ouvrés/);
  assert.equal(body.template_params.reply_to, 'vertiflow.pro@gmail.com');
});

test('owner email includes exact Printful lines and draft reference', async () => {
  await client.sendOwnerReview(order);
  const params = JSON.parse(request.options.body).template_params;
  assert.equal(params.to_email, 'vertiflow.pro@gmail.com');
  assert.match(params.order_lines, /501/);
  assert.match(params.printful_order_id, /987/);
});
```

- [x] **Step 2: Implement the authenticated EmailJS REST client**

POST `https://api.emailjs.com/api/v1.0/email/send` with `service_id`, `template_id`, `user_id`, `accessToken`, and template parameters. Treat non-2xx responses as retryable delivery failures. Keep the exact approved customer copy in code or template variables; do not trust browser-provided email body content.

- [x] **Step 3: Write failing paid-session webhook tests**

Cover the paid, unpaid, replay, mismatch, base64, and email-failure paths with this injected harness:

```js
function createHarness({ paymentStatus = 'paid', printfulFailure, customerEmailFailure } = {}) {
  const calls = { drafts: 0, customerEmails: 0, ownerEmails: 0, rawBody: null };
  const session = {
    id: 'cs_test_123',
    payment_status: paymentStatus,
    payment_intent: 'pi_test_123',
    customer_details: { email: 'lea@example.com' },
    metadata: { first_name: 'Léa', last_name: 'Martin' },
  };
  const stripe = {
    webhooks: {
      constructEvent: (body) => {
        calls.rawBody = body;
        return { type: 'checkout.session.completed', data: { object: session } };
      },
    },
    checkout: { sessions: {
      listLineItems: async () => ({
        data: [{
          quantity: 1,
          price: { metadata: { printful_sync_variant_id: '501', product_slug: 'tshirt-climb' } },
        }],
      }),
      update: async (_id, { metadata }) => {
        session.metadata = metadata;
        return session;
      },
    } },
    paymentIntents: { retrieve: async () => ({
      shipping: {
        name: 'Léa Martin',
        address: { line1: '1 rue du Test', city: 'Bordeaux', postal_code: '33000', country: 'FR' },
      },
    }) },
  };
  const printful = {
    createOrGetDraft: async () => {
      calls.drafts += 1;
      if (printfulFailure) throw Object.assign(new Error('draft mismatch'), { permanent: true });
      return { id: 987, status: 'draft', items: [{ sync_variant_id: 501, quantity: 1 }] };
    },
  };
  const email = {
    sendCustomerConfirmation: async () => {
      calls.customerEmails += 1;
      if (customerEmailFailure) throw new Error('EmailJS unavailable');
    },
    sendOwnerReview: async () => { calls.ownerEmails += 1; },
  };
  return {
    calls,
    handler: createWebhookHandler({ stripe, printful, email, webhookSecret: 'whsec_test' }),
  };
}

test('paid session creates one draft and sends both emails once on replay', async () => {
  const { handler, calls } = createHarness();
  const event = { body: '{}', headers: { 'stripe-signature': 'sig' } };
  assert.equal((await handler(event)).statusCode, 200);
  assert.equal((await handler(event)).statusCode, 200);
  assert.deepEqual(calls, {
    drafts: 1, customerEmails: 1, ownerEmails: 1, rawBody: '{}',
  });
});

test('unpaid session creates nothing', async () => {
  const { handler, calls } = createHarness({ paymentStatus: 'unpaid' });
  assert.equal((await handler({ body: '{}', headers: { 'stripe-signature': 'sig' } })).statusCode, 200);
  assert.equal(calls.drafts, 0);
});

test('permanent Printful mismatch alerts only the owner', async () => {
  const { handler, calls } = createHarness({ printfulFailure: true });
  assert.equal((await handler({ body: '{}', headers: { 'stripe-signature': 'sig' } })).statusCode, 200);
  assert.equal(calls.customerEmails, 0);
  assert.equal(calls.ownerEmails, 1);
});

test('base64 body is decoded and email failure remains retryable', async () => {
  const { handler, calls } = createHarness({ customerEmailFailure: true });
  const response = await handler({
    body: Buffer.from('{"paid":true}').toString('base64'),
    isBase64Encoded: true,
    headers: { 'stripe-signature': 'sig' },
  });
  assert.equal(response.statusCode, 500);
  assert.equal(calls.rawBody, '{"paid":true}');
  assert.equal(calls.drafts, 1);
});
```

- [x] **Step 4: Rewrite the webhook as a resumable state machine**

For `checkout.session.completed` and `checkout.session.async_payment_succeeded`:

1. Verify the raw body signature.
2. Require `session.payment_status === 'paid'`.
3. Retrieve line items with expanded Prices and retrieve the PaymentIntent shipping data.
4. Validate Checkout provenance v1, line count, livemode, expanded one-time Price/Product facts, and the canonical SHA-256 digest. Accept a historical archived Price when those facts still match; fail closed on missing or invalid provenance.
5. Derive the deterministic namespaced 32-character Printful external ID. If `metadata.printful_draft_id` is absent, create or retrieve the draft by that external ID, validate it, then update Session metadata with both draft and external IDs.
6. If `metadata.customer_email_sent !== 'true'`, send the customer template and update metadata.
7. If `metadata.owner_email_sent !== 'true'`, send the owner template and update metadata.
8. Return 200 only after all required steps are complete, or after a permanent failure has been reported to Maxime.

Keep metadata updates additive:

```js
await stripe.checkout.sessions.update(session.id, {
  metadata: {
    ...session.metadata,
    printful_external_id: derivePrintfulExternalId(session.id),
    printful_draft_id: String(draft.id),
    fulfillment_status: 'awaiting_owner_confirmation',
  },
});
```

Unhandled event types return 200 without side effects. Retryable Printful or EmailJS failures return 500. Permanent mapping or address failures send an owner alert and return 200 so Stripe does not retry forever.

- [x] **Step 5: Run focused and full tests**

Run: `node --test tests/emailjs.test.js tests/stripe-webhook.test.js`

Expected: PASS.

Run: `npm test`

Expected: all tests PASS.

- [x] **Step 6: Commit**

```bash
git add functions/lib/emailjs.js functions/stripe-webhook.js tests/emailjs.test.js tests/stripe-webhook.test.js
git commit -m "feat: automate paid order preparation"
```

---

### Task 7: Configure, integrate, and verify the complete pipeline

**Status:** Repository configuration, documentation, runtime pins, static checks, and automated tests complete. Steps 4-6 are external release gates and remain pending.

**Files:**
- Modify: `.env.example`
- Modify with explicit approval: `netlify.toml`
- Modify with explicit approval: `package.json`
- Modify with explicit approval: `package-lock.json`
- Modify: `docs/commerce-catalogue.md`
- Modify: `docs/superpowers/specs/2026-07-17-vertiflow-commerce-pipeline-design.md`
- Track: `docs/superpowers/plans/2026-07-17-vertiflow-commerce-pipeline.md`
- Create: `tests/environment.test.js`

**Interfaces:**
- Requires: `PRINTFUL_TOKEN` or `PRINTFUL_API_KEY`, `PRINTFUL_STORE_ID=15558986`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_SHIPPING_RATE_ID`, `EMAILJS_SERVICE_ID`, `EMAILJS_PUBLIC_KEY`, `EMAILJS_PRIVATE_KEY`, `EMAILJS_CUSTOMER_TEMPLATE_ID`, `EMAILJS_OWNER_TEMPLATE_ID`, `SITE_URL`, and optional promo variables.
- Runtime: `package.json` and lock root require Node `>=20`; Netlify pins Node `22`.

- [x] **Step 1: Add failing environment and runtime contract tests**

```js
const REQUIRED_COMMERCE_ENV = [
  'PRINTFUL_STORE_ID',
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_SHIPPING_RATE_ID',
  'EMAILJS_SERVICE_ID',
  'EMAILJS_PUBLIC_KEY',
  'EMAILJS_PRIVATE_KEY',
  'EMAILJS_CUSTOMER_TEMPLATE_ID',
  'EMAILJS_OWNER_TEMPLATE_ID',
  'SITE_URL',
];

test('production configuration documents every commerce secret without values', async () => {
  const example = await readFile('.env.example', 'utf8');
  for (const name of REQUIRED_COMMERCE_ENV) {
    assert.match(example, new RegExp(`^${name}=$`, 'm'));
  }
  assert.doesNotMatch(example, /sk_(?:live|test)_|rk_(?:live|test)_|re_[A-Za-z0-9]/);
});
```

- [x] **Step 2: Document environment, pin Node, and bundle the catalogue**

Add empty keys to `.env.example`. Add this approved Netlify configuration so the runtime catalogue is always bundled:

```toml
[functions]
  included_files = ["data/products.json"]
```

Set `engines.node` to `>=20` in package and lock root metadata, and set
`build.environment.NODE_VERSION = "22"` in Netlify without replacing build or function settings.

Update `docs/commerce-catalogue.md` with the nine-product publishing procedure, test/live Stripe separation, EmailJS template variables, Printful draft review, and rollback instructions.

- [x] **Step 3: Run static and unit verification**

Run: `npm test`

Expected: all tests PASS.

Run: `node -e "JSON.parse(require('node:fs').readFileSync('data/products.json'))"`

Expected: exit 0.

Run: `npm audit --omit=dev`

Expected: no high or critical vulnerabilities introduced by this work.

- [ ] **Step 4: Run Stripe test-mode integration**

1. Run Netlify Dev with test Stripe and EmailJS test-recipient configuration.
2. Run `stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook`.
3. Complete one card checkout for each of the nine products.
4. Complete a multi-item checkout and one redirect-method checkout.
5. Replay the same `checkout.session.completed` event twice.

Expected for every paid session: one Stripe payment, one unconfirmed Printful draft with exact variants, one customer email, and one owner email. Replay creates no second Printful order.

- [ ] **Step 5: Exercise failures without production charges**

Test an unknown product, invalid size, quantity 0 and 11, inactive variant, missing state for US, Printful timeout, Printful variant mismatch, EmailJS failure, and invalid webhook signature.

Expected: invalid checkout inputs fail before payment; retryable provider failures resume safely; mismatches never confirm; the owner receives an actionable error.

- [ ] **Step 6: Complete production preparation only after the remaining configuration and explicit approval**

Configure Netlify environment values and create the production Stripe webhook for `checkout.session.completed`, but do not run live Stripe catalogue reconciliation and do not place a live order without a separate explicit confirmation from Maxime.

- [x] **Step 7: Final repository verification and commit**

Run: `git diff --check && npm test`

Expected: clean diff check and all tests PASS.

```bash
git add .env.example netlify.toml docs/commerce-catalogue.md tests/environment.test.js
git commit -m "docs: add commerce operations runbook"
```

## Repository completion criteria (met)

- `data/products.json` contains exactly nine products and 107 active public variants.
- The browser cannot choose an amount, arbitrary Stripe Price, or arbitrary Printful variant.
- Automated paid-session coverage creates one validated unconfirmed draft and proves replay reuses the deterministic external ID.
- Automated customer and owner email paths run server-side and resume from Stripe metadata checkpoints.
- PKBA, Kenzi, generic Débardeur, and unrelated products remain untouched.
- All automated tests pass.
- No live Stripe or Printful confirmation action occurs without Maxime's explicit approval.

## External release gates (pending)

- Confirm Stripe test mode has nine managed Products and the intended Price history for all active variants.
- Complete real card, multi-item, redirect-method, replay, failure, and nine-product draft smoke tests.
- Verify one customer and one owner EmailJS delivery from the real webhook path.
- Create and verify the production webhook only after the missing environment values are supplied.
- Run no live order, live catalogue promotion, or Printful confirmation without explicit approval.
