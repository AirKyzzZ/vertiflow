# VertiFlow commerce and fulfilment pipeline

Date: 2026-07-17
Status: repository implementation complete; external smoke tests and live promotion pending

## Objective

Automate the work between a paid VertiFlow order and a ready-to-confirm Printful
order without risking the wrong garment, color, size, quantity, or price.

The only recurring manual action is Maxime's final review and confirmation in
Printful. Customer and owner emails are sent automatically from
`vertiflow.pro@gmail.com`.

This phase covers the existing storefront and its nine products. PKBA, Kenzi,
the generic Printful `Débardeur`, and all other Printful products remain
untouched and cannot be purchased through VertiFlow.

## Problems being fixed

The current checkout trusts the browser-provided amount and cart. A customer can
therefore change the amount before Stripe creates the PaymentIntent. The cart
also contains free-text product, color, and size values rather than Printful
variant IDs, so Maxime currently performs the product lookup manually.

The existing confirmation email runs in the browser through EmailJS. It can be
skipped when a payment redirects, the page closes, or client-side JavaScript
fails. Formspree is connected only to the contact form and is not part of order
processing.

The pipeline must establish server-owned price and product authority before it
automates fulfilment.

## Commercial catalogue

The live storefront is authoritative for product names and selling prices.
Printful is authoritative only for configured fulfilment products, variants,
mockups, and availability.

The catalogue contains nine commercial products. Six products combine separate
black and white Printful products, producing fifteen allowed Printful sync
products in total.

| Storefront product | Price | Allowed Printful sync products |
|---|---:|---|
| T-shirt CLIMB | 29.99 EUR | `376170525` T-shirt Unisex CLIMB (Noir); `377330919` T-shirt Blanc CLIMB |
| Hoodie VF Definition | 64.99 EUR | `376418591` Hoodie Noir VF Definition; `377337480` Hoodie Blanc VF Definition |
| Casquette VF | 29.99 EUR | `376418706` Casquette Noir VF; `377338630` Casquette Blanche VF |
| Shorts Performance VF | 47.99 EUR | `376418808` Shorts Noir Performance VF; `377338525` Shorts Blanc Performance VF |
| Coque iPhone VF | 29.99 EUR | `377417508` Coque iPhone Noir VF; `376418868` Coque iPhone Blanche VF |
| Débardeur VF | 19.99 EUR | `385121662` Débardeur VF Noir; `385122205` Débardeur VF Blanc |
| Cache-cou VF | 24.99 EUR | `376418913` Cache-cou Noir VF |
| Bob VF | 24.99 EUR | `385122974` BOB |
| Short Confort VF | 29.99 EUR | `385123410` Shorts confort VertiFlow |

The catalogue explicitly models every storefront option and resolves it to one
Printful `sync_variant_id`. It never discovers sellable products by age, name,
or approximate string matching.

There are 107 currently purchasable product, color, and size combinations. The
following Printful inconsistencies are deliberate mapping rules:

- Storefront size `M` for Bob and Cache-cou resolves to Printful `One size`.
- Coque Noir and Blanc are distinguished by their Printful sync product IDs;
  Printful reports both variant colors as `Glossy`.
- Shorts Performance colors are distinguished by their Printful sync product
  IDs because the Printful color metadata is inconsistent.

Adding a future collection is an explicit publishing action: add its approved
Printful sync product IDs, storefront price, public options, and copy to the
commercial catalogue. A Printful product never becomes public merely because it
exists in the store.

## Catalogue synchronization

The Printful synchronization reads the complete Printful store but publishes
only the fifteen allowlisted sync products into the commercial catalogue. It
enriches them with exact active variants and mockup URLs while preserving
storefront prices and Stripe identifiers.

Synchronization fails without replacing the last valid catalogue when:

- an allowlisted Printful product is missing, ignored, or unsynchronized;
- a storefront option has zero or multiple matching variants;
- a variant ID is duplicated;
- a configured color or size disappears;
- the resulting catalogue does not contain exactly the nine configured
  commercial products.

Unrelated Printful products are ignored, not modified or deleted.

## Checkout and price authority

The browser sends only a selected catalogue identifier and quantity. It never
sends an authoritative amount or arbitrary Printful variant ID.

For each cart line, the server:

1. resolves the public selection against the committed catalogue;
2. rejects unknown, inactive, or ambiguous selections;
3. loads the storefront price from the server-owned catalogue;
4. resolves the exact Printful sync variant;
5. creates the Stripe line item from the approved Stripe Price;
6. calculates discounts and shipping server-side.

Stripe Prices are reconciled from storefront prices, not Printful retail
prices. One Stripe Price is associated with each sellable variant so Stripe
line items retain the exact fulfilment choice.

Checkout uses Stripe Checkout Sessions with the existing custom Payment Element
experience. Native Stripe line items and shipping data replace the current
flattened metadata cart. The endpoint accepts POST only, returns generic client
errors, and logs detailed failures server-side.

### Checkout provenance and historical Prices

Checkout provenance version 1 hashes a canonical, order-independent list of
each line's Stripe Price ID, Stripe Product ID, currency, unit amount,
commercial slug, Printful sync product/variant IDs, Printful catalogue variant
ID, and quantity. Checkout creation records the version, base64url SHA-256
digest, line count, and Stripe mode in Session metadata.

The paid webhook reconstructs those facts from Stripe-expanded line items and
Products, validates their VertiFlow metadata and livemode, and compares the
digest in constant time. Missing, unsupported, duplicated, malformed, or
mismatched provenance fails closed before Printful or customer-email side
effects and is reported to the owner as a permanent catalogue mismatch.

An inactive or archived Stripe Price can still be accepted for a Session that
was created while that Price was current. Acceptance depends on the signed
webhook, exact Price/Product facts, versioned digest, and livemode, not the
current catalogue pointer or current Price `active` flag. This permits a paid
delayed-payment Session to complete after a later catalogue reconciliation
archives its Price.

The digest detects accidental or out-of-band mutation after Checkout creation;
it is not a defence against a privileged Stripe-account writer who can replace
both line facts and Session metadata. Stripe account writers are therefore a
trusted administrative boundary.

## Paid-order flow

```text
Storefront product, color, size, quantity
                    |
                    v
Server catalogue lookup and authoritative price
                    |
                    v
Stripe Checkout Session and customer payment
                    |
                    v
Verified checkout.session.completed webhook
                    |
                    v
Printful draft with exact sync_variant_ids
                    |
          +---------+---------+
          |                   |
          v                   v
Customer confirmation     Owner review email
                              |
                              v
                  Maxime confirms in Printful
```

The webhook performs fulfilment only for a verified, paid Stripe session. A
failed or incomplete payment creates no Printful order and sends no order
confirmation.

The Printful draft uses a deterministic, namespaced external ID derived as
`vf_` plus the first 29 base64url characters of the Checkout Session ID's
SHA-256 digest. The resulting `external_id` is exactly 32 characters and fits
Printful's limit. The full Checkout Session ID remains Stripe's object ID and
is included in the owner email; Stripe metadata records the derived Printful
external ID and draft state for reconciliation. Creation uses `confirm: false`;
Printful is not allowed to charge the VertiFlow account or begin production
automatically. Webhook retries derive or reuse the same external ID instead of
creating a second order.

After creation, the response is checked against the canonical cart: product,
sync variant, quantity, and recipient must match. A mismatch remains an
unconfirmed draft and is reported to Maxime.

## Email delivery

EmailJS remains the delivery service because it is already connected to
`vertiflow.pro@gmail.com`, but calls move from browser JavaScript to the verified
Stripe webhook.

Two distinct templates are sent:

### Customer confirmation

Recipient: the paid order's customer email.
Reply-to: `vertiflow.pro@gmail.com`.

```text
Bonjour [PRÉNOM] [NOM],

VertiFlow confirme la bonne réception de votre commande. Tout est en ordre : la
préparation est en cours et la livraison est estimée à environ 7-10 jours ouvrés.

Pour toute question ou modification, il suffit de répondre à ce message.

Cordialement,

Maxime Mansiet
Fondateur — VertiFlow
vertiflow.pro@gmail.com
07 83 97 23 60
```

The checkout collects first and last names separately so the greeting is not
derived by splitting a free-text full name.

### Owner review notification

Recipient: `vertiflow.pro@gmail.com`.

It includes:

- Stripe session and payment references;
- customer and shipping details;
- each storefront item, color, size, quantity, and exact Printful sync variant;
- the total charged;
- the Printful draft ID and dashboard link;
- a clear warning if any validation failed.

The existing browser-side EmailJS call is removed. Formspree remains unchanged
for the contact form.

Stripe metadata records the Printful draft ID and the state of both email sends.
This makes ordinary webhook retries resume from the incomplete step. Because
EmailJS does not provide an idempotency key, a process crash after EmailJS accepts
an email but before Stripe metadata is updated can rarely produce a duplicate
email. It cannot duplicate a Printful order or charge. Exact-once email delivery
would require a different provider or durable job store and is outside this
phase.

## Failure handling

The pipeline fails closed:

- Invalid cart or mapping: reject checkout before payment.
- Failed or incomplete payment: create nothing and send nothing.
- Retryable Printful timeout or 5xx: return a retryable webhook response; reuse
  the deterministic namespaced Printful external ID on retry.
- Permanent Printful rejection: keep the paid Stripe order visible, send Maxime
  an urgent failure notification, and require manual resolution.
- Printful response mismatch: never confirm; notify Maxime with expected and
  actual line items.
- Customer email failure: retain the valid Printful draft, record the failure,
  and retry the email path.
- Owner email failure: retain the valid draft and retry the notification path.
- Unexpected webhook event: acknowledge without fulfilment.

No error path confirms a Printful order automatically.

## Security and privacy

- Verify the Stripe webhook signature against the raw request body, including
  base64-encoded Netlify events.
- Keep Stripe, Printful, and EmailJS private credentials only in environment
  variables.
- Use restricted test-mode Stripe keys for catalogue reconciliation and
  Checkout/webhook verification. The current reconciliation script rejects
  live keys; Checkout and the webhook reject them as well. Production permissions
  and live support require a separate review.
- Require a server-held 32-character-or-longer integration token for test Checkout.
  Record a versioned server authorization marker in Session metadata and require
  that marker before any Printful or email side effect. This lets token rotation
  block new Checkout without abandoning authorized retries. Never bundle the token
  into the static site.
- Do not return provider error details to the browser.
- Store shipping information in Stripe's native customer and shipping fields,
  not a large metadata database.
- Send customer PII only to Stripe, Printful, EmailJS, and Maxime as required to
  process the order.

## Verification

Automated verification covers:

- every one of the 107 public option combinations resolving to exactly one
  allowlisted Printful sync variant;
- no PKBA, Kenzi, generic Débardeur, or unrelated ID entering the catalogue;
- all nine authoritative prices and server-side total calculation;
- invalid variant, quantity, price, and promo inputs being rejected;
- versioned Checkout provenance, historical archived Price acceptance, mode
  matching, and missing or mutated provenance failing closed;
- missing test access and every live-mode Session producing no fulfillment or
  email side effect;
- Stripe webhook signature verification;
- repeated Stripe events producing one Printful external ID;
- Printful response validation;
- resumable email and fulfilment states;
- customer and owner template variables.

External integration verification remains pending. It must use Stripe test mode,
a temporary private integration-access token injected only by test tooling, and
unconfirmed Printful drafts, create at least one representative draft for
each of the nine commercial products, and exercise multi-item carts, redirect
payment methods, webhook retries, Printful timeouts, and EmailJS failures. It
must never confirm a Printful order or incur a production charge.

## Rollout

1. Complete: finalize and validate the curated nine-product catalogue.
2. Complete in code: reconcile Stripe Products and Prices from storefront prices
   behind a test-key-only guard.
3. Complete: replace browser-authoritative payment creation with
   server-authoritative Checkout Sessions.
4. Complete in code: create unconfirmed Printful drafts from verified paid test
   Sessions; real representative drafts remain pending.
5. Complete in code: move customer confirmation and owner review emails to the
   webhook; real delivery remains pending.
6. Pending: execute the browser/provider mapping, retry, failure, and
   representative draft matrix.
7. Pending: complete production environment configuration and create the Stripe
   webhook only with explicit approval.
8. Pending separate approval: run one controlled live low-value order and inspect
   Stripe, Printful, and both emails before opening normal traffic.

Automatic Printful confirmation is explicitly out of scope. Changing
`confirm: false` requires a separate deliberate decision after operational
evidence, not an incidental code change.

## Deferred scope

- Instagram content generation and publishing.
- Blog automation or AI-generated parkour action imagery.
- Automatic Printful production confirmation.
- PKBA or other storefront catalogues.
- A new transactional email provider or exact-once email job store.
