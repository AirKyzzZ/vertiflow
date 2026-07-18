# Commerce catalogue and operations runbook

`data/products.json` is the reviewed runtime catalogue for the storefront, Stripe,
and Printful. It contains exactly nine VertiFlow products, fifteen approved Printful
sync products, and 107 active public variants. PKBA, Kenzi, the generic Printful
Débardeur, and every other Printful product are out of scope and must remain absent.

## Environment contract

Copy `.env.example` to an ignored local `.env`; all committed values remain empty.
Set the same private values in Netlify when the controlled integration stage is approved.

| Variable | Purpose and policy |
| --- | --- |
| `PRINTFUL_API_KEY` | Preferred Printful credential. The runtime supports `PRINTFUL_TOKEN` as an alias, so set exactly one. |
| `PRINTFUL_TOKEN` | Backward-compatible alias actually accepted by the current runtime. |
| `PRINTFUL_STORE_ID` | Use the approved VertiFlow store ID `15558986`. It stays empty in `.env.example` so no operational value is committed. |
| `STRIPE_SECRET_KEY` | Server-only Stripe key. Checkout and reconciliation currently accept test-mode keys only. |
| `STRIPE_PUBLISHABLE_KEY` | Matching test-mode key returned by the Checkout Session endpoint. |
| `STRIPE_WEBHOOK_SECRET` | Stripe signature secret for the raw webhook body. |
| `STRIPE_SHIPPING_RATE_ID` | Server-owned shipping rate used by Checkout Sessions. |
| `VERTIFLOW_TEST_ACCESS_TOKEN` | Server-held random value of at least 32 characters. Test Checkout requires it in `x-vertiflow-test-access`; successful authorization adds a versioned server marker to the Session. Never put it in static browser code. |
| `EMAILJS_SERVICE_ID` | Authenticated EmailJS service for `vertiflow.pro@gmail.com`. |
| `EMAILJS_PUBLIC_KEY` | EmailJS user/public key sent only by the server-side webhook client. |
| `EMAILJS_PRIVATE_KEY` | EmailJS access token sent only by the server-side webhook client. |
| `EMAILJS_CUSTOMER_TEMPLATE_ID` | Customer-confirmation template, distinct from the owner template. |
| `EMAILJS_OWNER_TEMPLATE_ID` | Owner-review template, distinct from the customer template. |
| `SITE_URL` | HTTP(S) base URL for the Stripe return URL. |
| `VERTIFLOW_PROMO_CODE` | Optional customer-entered promo; any non-empty input must equal this value. |
| `STRIPE_PROMOTION_CODE_ID` | Required only when the promo is used; the server sends this approved Stripe promotion code. |

Never expose Stripe secret keys, Printful credentials, EmailJS private credentials, the test
access token, shipping rates, or arbitrary Stripe Prices in browser code. The browser submits
catalogue selection and quantity only; the server resolves the price and exact Printful variant.

## Publish the nine-product catalogue

1. In Printful, prepare only the reviewed VertiFlow sync products and their print files.
   Do not modify PKBA, Kenzi, generic Débardeur, or unrelated products.
2. Run the Printful synchronizer against the VertiFlow store with one supported Printful
   credential and `PRINTFUL_STORE_ID=15558986` in the local environment.
3. Review the generated `data/products.json`: nine commercial products, fifteen approved
   sync product IDs, 107 active variants, exact color/size mappings, and no unrelated IDs.
4. Commit the reviewed catalogue separately from provider-side changes. Netlify bundles
   `data/products.json` with every function through `netlify.toml`.
5. Publish storefront copy only after the catalogue review. A product existing in Printful
   never makes it sellable by itself.

`printful_sync_variant_id` is the exact configured garment and print file sent to
Printful. `printful_catalog_variant_id` is only the blank-product metadata used for display.

## Stripe test-to-live promotion

Reconcile Stripe from the committed retail prices, never Printful retail prices. The current
`sync-stripe-prices.js` guard accepts `sk_test_` or `rk_test_` only, and checkout requires
a matching `sk_test_` or permissioned `rk_test_` secret paired with a `pk_test_` key. There
is no supported live-sync toggle in current code; do not add one as an environment workaround.

Prefer a restricted `rk_test_` key with only the permissions needed for test catalogue
reconciliation. Checkout also accepts a permissioned restricted test secret paired with the
matching `pk_test_` publishable key. Live keys remain rejected by the current checkout,
webhook, and reconciliation paths.

1. Configure test credentials and reconcile the nine Stripe Products and one Price for each
   of the 107 active variants.
2. Generate a private random `VERTIFLOW_TEST_ACCESS_TOKEN` of at least 32 characters for the
   controlled test window. Inject it into test requests as `x-vertiflow-test-access` through
   local tooling or browser automation; never commit, log, persist, or bundle it in the site.
3. Run the full test-mode checkout, webhook, Printful-draft, email, replay, and failure
   matrix below. Inspect every created draft manually, then remove or rotate the access token.
4. Record the reviewed production credentials and webhook endpoint without sending them or
   mutating Netlify in this repository task.
5. Obtain explicit approval before any live catalogue reconciliation, production webhook
   creation, live checkout, Printful order, or Printful confirmation. A future live path must
   be implemented and reviewed deliberately; it is not enabled by changing environment values.

## Webhook, Printful, and EmailJS operation

Checkout creation records provenance version 1 in Stripe Session metadata: the canonical
line count, mode, and a base64url SHA-256 digest over sorted Price ID, Product ID, currency,
unit amount, commercial slug, three Printful IDs, and quantity tuples. The webhook rebuilds
those facts from expanded Stripe Price/Product data before any fulfilment side effect.
Missing or unsupported provenance, digest mismatch, duplicate identity, malformed provider
metadata, or livemode mismatch fails closed and alerts the owner.

Historical archived Prices are intentionally accepted when the paid Session's exact facts
still match its v1 digest and VertiFlow Stripe metadata. This allows a delayed payment to
complete after catalogue reconciliation has replaced and archived a Price. The current
catalogue is used for richer display labels when it still matches, not as authority to
rewrite the historical paid line.

The provenance digest protects against accidental or out-of-band mutation, not a privileged
Stripe-account writer who can change both line facts and Session metadata. Treat every
Stripe account writer as a trusted administrator and restrict access accordingly.

Only a verified paid test-mode Stripe event carrying the server-issued test-access marker may create
a Printful draft. Missing authorization and all live-mode Sessions are acknowledged without
Printful or email side effects. Token rotation blocks new checkout attempts without abandoning
already-authorized Session retries. The webhook derives a
deterministic, 32-character-or-shorter `external_id` from the Checkout Session ID
(`vf_` plus the first 29 base64url characters of its SHA-256 digest), then uses
`confirm: false`. The full Session ID remains the Stripe object identifier and appears in
the owner email; resumable Stripe metadata stores the derived external ID and Printful draft
ID. The webhook validates returned product, variant, quantity, and recipient before leaving
the draft for manual review. Never use a raw Checkout Session ID as the Printful
`external_id`.

## Deployment runtime

Local and CI installs require Node.js 20 or newer through `package.json` and the lockfile.
Netlify builds and Functions use Node.js 22 through `build.environment.NODE_VERSION` in
`netlify.toml`. Keep both declarations aligned when raising the supported runtime.

Before manually confirming a draft in Printful, verify the Stripe session/payment reference,
customer and shipping address, every storefront color/size/quantity, exact sync variant ID,
charged total, and the draft dashboard link in the owner email. Confirmation and production
start only when Maxime deliberately confirms it in Printful.

Configure one authenticated generic VertiFlow EmailJS template and use its ID for both
`EMAILJS_CUSTOMER_TEMPLATE_ID` and `EMAILJS_OWNER_TEMPLATE_ID`. The template consumes
`to_email`, `reply_to`, `subject`, and `message`; the webhook builds the complete customer or
owner message before sending it. Both emails are sent server-side from the verified webhook,
not by the browser. Keep unrelated EmailJS templates, including Klyx templates, untouched.

The configured EmailJS service must be the Gmail service connected as
`vertiflow.pro@gmail.com`. In EmailJS Account > Security, enable non-browser API access and
keep the private-key requirement enabled because the webhook is the sender. A 403 mentioning
non-browser access means the account setting is disabled; `Gmail_API: Invalid grant` means the
VertiFlow Gmail OAuth connection must be reconnected before replaying the Stripe event.

Email delivery is at-least-once, not exactly-once: a crash after EmailJS accepts a message but
before Stripe metadata is recorded can produce a duplicate email. This cannot duplicate the
Printful draft or charge. Do not attempt to suppress a suspected duplicate by re-running order
creation; inspect the Stripe metadata and existing Printful draft first.

## Replay and failure matrix

| Situation | Expected result | Operator action |
| --- | --- | --- |
| Unknown product, invalid size, inactive mapping, quantity 0 or 11 | Checkout rejects before payment. | Correct the selection; do not create a manual order. |
| Invalid webhook signature or unpaid event | No draft and no email. | Inspect Stripe endpoint configuration; never bypass signature validation. |
| Replayed paid event | Existing deterministic external ID is reused; no second draft. | Verify one draft and resumable metadata before retrying. |
| Printful timeout or 5xx | Webhook fails retryably; the next retry reuses the external ID. | Allow Stripe retry, then inspect the one draft. |
| Printful rejection or returned variant/address mismatch | Unconfirmed draft or paid Stripe record remains; owner receives an actionable alert. | Do not confirm; resolve manually with Printful/customer. |
| Customer or owner EmailJS failure | Valid draft is retained and email path is retried. | Check template credentials and delivery status; expect possible duplicate email. |
| Missing state for US, CA, or AU | Address validation fails permanently. | Obtain the required state before manual handling. |

## Rollback

1. Stop new checkout traffic at the hosting layer or remove the checkout entry point; do not
   disable webhook signature verification.
2. Keep the committed catalogue and Stripe records for reconciliation. Do not delete drafts,
   paid sessions, or webhook metadata.
3. Leave all unconfirmed Printful drafts unconfirmed. Review each paid session and contact the
   customer manually if necessary.
4. Revert only the reviewed deployment/configuration change after preserving evidence, then
   run `npm test` and the catalogue checks before restoring traffic.

No live Stripe sync, live order, or Printful confirmation occurs without explicit approval.
