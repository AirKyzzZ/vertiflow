# VertiFlow — full Next.js storefront and go-live

Date: 2026-08-22
Status: approved design, pending implementation plan
Target: selling to strangers before 1 September 2026

## Why this exists

`vertiflow.fr` is live and cannot take an order. `POST /.netlify/functions/create-checkout-session`
returns `500 {"error":"Checkout configuration error"}` in production today, and the Next.js
brand refresh on `feature/brand-refresh-2026` has never been deployed (`/api/checkout` is 404,
`/_next/static` is 404, the served `<title>` is still the old one).

Underneath that, the commerce pipeline is already written and covered by 177 passing tests:
Stripe Checkout in `elements` mode, a Printful order client, EmailJS customer and owner mail,
promo codes, and a 684-line webhook with idempotency and provenance verification. The catalogue
is fully reconciled — 9 products, 107 variants, each carrying real Printful sync and catalog
variant IDs alongside Stripe price IDs.

So this is not an integration project. It is a refactor of the presentation layer onto Next.js,
plus the removal of six deliberate guards that make a real sale impossible.

## Goals

1. Every page of `vertiflow.fr` served by the Next.js App Router in the refreshed brand.
2. A stranger can pay with a real card, with live Stripe keys, on our own domain.
3. Paid orders reach Printful as drafts for manual confirmation, and trigger customer and owner email.
4. The 177 existing tests keep passing, and test-mode rehearsal remains possible after go-live.

## Non-goals

- Accounts, login, or order history. `sign-in.html` and `sign-up.html` are deleted; no auth backend exists.
- Automatic Printful production. Orders stay `confirm=false` until the first live orders are verified by hand.
- Changing prices, products, or the Printful catalogue.
- Replacing EmailJS with a different mail provider.

## The six guards

Going live is gated by six deliberate clamps. All six lift together; lifting a subset produces a
broken half-state.

| # | Location | Current behaviour | After |
|---|---|---|---|
| 1 | `functions/create-checkout-session.js:26` | throws on live keys | accepts live and test, mode recorded in metadata |
| 2 | `functions/create-checkout-session.js:57` | requires secret `x-vertiflow-test-access` header | gate removed in live mode, retained for test mode |
| 3 | `functions/lib/printful-orders.js:293` | `POST /orders?confirm=false` | unchanged, by decision |
| 4 | `scripts/sync-stripe-prices.js:18` | refuses live keys | accepts live keys behind an explicit flag |
| 5 | `functions/stripe-webhook.js:644` | "A test Stripe secret is required" | accepts live and test |
| 6 | `functions/stripe-webhook.js:487` | rejects `livemode !== false` | asserts livemode matches the session's recorded mode |

Guard 3 stays shut on purpose: paid orders become Printful drafts, confirmed by hand in the
dashboard. This is the chosen fulfilment posture, not an oversight.

The webhook already carries a `vf_livemode` provenance system (`livemodeMatches`, lines 160–250)
written to work in both modes. Guards 5 and 6 are edge clamps over machinery that is already
mode-aware, so lifting them is a small change rather than a rewrite.

## Route map

The site header already declares the intended scheme, so routes follow it rather than inventing one.

| Route | Source | Kind |
|---|---|---|
| `/` | exists | static |
| `/commencer` | new | static |
| `/boutique` | `products.html` | static, revalidated |
| `/boutique/[slug]` | 9 product pages | `generateStaticParams` |
| `/panier` | `checkout.html` (cart half) | client |
| `/commande` | `checkout.html` (form half) | client |
| `/commande/succes` | `success.html` | client |
| `/commande/annulee` | `cancel.html` | static |
| `/journal` | `blog.html` | static |
| `/journal/[slug]` | 3 event pages | MDX |
| `/a-propos` | `about.html` | MDX |
| `/faq` | `faq.html` | MDX |
| `/guide-des-tailles` | `guide-des-tailles.html` | MDX |
| `/contact` | `contact.html` | client form |
| `/cgv` | `conditions-generales-de-vente.html` | MDX |
| `/mentions-legales` | `mentions-legales.html` | MDX |
| `/confidentialite` | `politique-de-confidentialite.html` | MDX |
| `/conditions-utilisation` | `conditions-utilisation.html` | MDX |
| `/propriete-intellectuelle` | `propriete-intellectuelle.html` | MDX |
| `/accessibilite` | `accessibilite.html` | MDX |
| `/livraison-et-paiement` | `livraison-paiment.html` | MDX |

Deleted: `sign-in.html`, `sign-up.html`, `no-color.html`, `details-produit.html`, `product-detail.html`.

### Redirects

Every legacy `.html` path gets a 301 in `next.config.mjs`. The site has no sitemap, no robots.txt
and no canonical tags, so SEO equity is thin, but the URLs are live and linked from Instagram.

Three need care. `coque-vf.html` maps to slug `coque-iphone-vf`. `livraison-paiment.html` carries
a typo we do not reproduce in the new path. And `checkout.html` split into two routes, so it
redirects to `/panier`, the cart being the correct entry point for someone arriving on an old link.

The five deleted pages redirect too: `sign-in.html` and `sign-up.html` to `/`, `no-color.html`
and both unused templates to `/boutique`.

## Catalogue schema

`stripe_price_id` becomes mode-keyed so live and test prices coexist:

```json
"stripe_price_id": { "test": "price_1TuDoA...", "live": "price_1Xxxxx..." }
```

Touches `data/products.schema.json`, `src/lib/catalogue.ts`, `functions/lib/catalogue.js`,
`functions/stripe-webhook.js`, and the fixtures in `tests/`. Readers select by the active Stripe
mode. This keeps all 177 tests passing and preserves test-mode rehearsal after launch.

Creating the 107 live prices is a one-off run of `scripts/sync-stripe-prices.js` against live
keys, behind an explicit opt-in flag, writing the `live` values back into `data/products.json`.
The script is idempotent, and the result is committed.

## Cart

Client-side, `localStorage`, key `cart`. A `CartProvider` context exposes read, add, update
quantity, remove, and clear.

The legacy shape is not what we want to keep. `public/js/custom.js:110-141` writes
`{id, displayPrice, size, color, quantity, image}`, keying the product as `id` and caching a
price and image URL in the browser. `checkout.html:368` then remaps `id` to `slug` at request
time. The new shape is `{slug, color, size, quantity}` — no cached price, no cached image, both
derived from `data/products.json` at render.

A migration runs on first read: items carrying `id` are rewritten to `slug`, and `displayPrice`
and `image` are dropped. A returning visitor keeps their cart. Malformed or unparseable
`localStorage` resets to an empty cart rather than throwing.

The client cart is never trusted. `resolveCart` in `functions/lib/catalogue.js` re-prices every
line from `data/products.json` server-side, rejects unknown variants and duplicates, and caps
quantity at 1–10 per line and 100 lines per cart. Prices are never read from the client.

`coque-iphone-vf` has 46 variants against a single colour axis, so the variant selector must handle
a long single-axis list as well as the colour-plus-size grid the other eight products use.

## Checkout

Embedded Stripe Payment Element on our own domain, preserving the existing `ui_mode: 'elements'`
backend.

1. `/commande` collects customer and shipping details and reads the cart.
2. `POST /api/checkout` resolves the cart server-side and creates a Checkout Session, returning
   `clientSecret`, `sessionId`, `publishableKey`.
3. `@stripe/stripe-js` mounts the Payment Element with that client secret.
4. Stripe returns to `/commande/succes?session_id={CHECKOUT_SESSION_ID}`.
5. `POST /api/checkout/session` reads the session for the confirmation screen.
6. Stripe fires `checkout.session.completed` to `/api/stripe/webhook`, which verifies provenance,
   creates the Printful draft, and sends customer and owner mail.

Fulfilment is driven by the webhook, never by the success page. A customer who closes the tab
still gets their order.

The `return_url` in `create-checkout-session.js` currently points at `/success.html` and moves to
`/commande/succes`.

### Endpoint consolidation

`/.netlify/functions/*` and `/api/*` currently both exist, the former deployed and the latter not.
After the refactor `/api/*` is canonical; the legacy function paths get 301s so any cached client
still resolves.

## Content pages

MDX via `@next/mdx`. Legal text is migrated verbatim — CGV, mentions légales and politique de
confidentialité are legal documents and are re-laid-out, never rewritten. A shared `<Prose>`
component carries typography for all of them.

`/commencer` is new, and answers BRAND.md's six questions in order: what is this, can I do it,
where, when, what does it cost, will I be the worst one there.

## New dependencies

`@stripe/stripe-js` and `@next/mdx`. Both approved 2026-08-22.

## Error handling

Fail fast with context, never swallow. Customer-facing copy stays generic; detail goes to logs.

- Cart resolution failure returns 400 and the cart page names the offending line.
- Stripe configuration failure returns 500 `Checkout configuration error`, unchanged.
- Payment failure surfaces Stripe's own message inline; the cart is preserved.
- Printful failure is classified retryable or permanent. Retryable returns 500 so Stripe retries.
  Permanent alerts the owner once and does not retry. This logic exists and is tested; it is not changed.
- A paid order that fails fulfilment must always alert the owner. Money taken without a garment
  ordered is the one failure that cannot be silent.

## Testing

The 177 existing tests must stay green throughout; they cover the commerce core, which this
refactor deliberately does not rewrite.

New coverage:
- cart reducer: add, merge duplicate lines, quantity bounds, remove, clear, malformed `localStorage`
- legacy cart shape migration
- `generateStaticParams` emits all 9 slugs
- redirect map covers every deleted `.html` path
- mode-keyed price selection resolves correctly in both modes
- the six guards behave correctly in live mode

Before go-live, one end-to-end rehearsal in test mode, then one real card purchase by the owner,
refunded, with the Printful draft confirmed by hand.

## Deployment

Netlify, site `35cbc8b8-a05e-4515-bdaf-e4f1732cdcde`, via Netlify CLI.

The production 500 is a context-scoping bug, not missing credentials. Every required variable
exists in the Netlify project, but five are scoped only to `deploy-preview` and `branch-deploy`
and are absent from `production`:

- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SHIPPING_RATE_ID`
- `STRIPE_WEBHOOK_SECRET`
- `EMAILJS_PRIVATE_KEY`
- `EMAILJS_CUSTOMER_TEMPLATE_ID`

`validateEnvironment` checks `STRIPE_PUBLISHABLE_KEY` first, so production throws
`Stripe key modes must match` before reaching Stripe. Checkout has therefore always worked on
preview and branch deploys and never on `vertiflow.fr`, which is why the breakage went unnoticed.

Fix by scoping those five to production. Three stale names — `EMAILJS_TEMPLATE_ID`,
`EMAILJS_USER_ID`, `STRIPE_SECRET_TEST_KEY` — are read by nothing in the current source and are
deleted once the rest is verified.

Deploy to a preview URL first, rehearse there, then promote.

## Sequencing

The Instagram post is Monday 25 August, two days out. Full scope does not fit and is not
attempted before the post. Ordered so revenue lands first.

**Monday set — must be live:**

1. Foundation — MDX, `<Prose>`, redirect map, delete dead pages
2. Commerce routes — `/boutique`, `/boutique/[slug]`, `/panier`, `/commande`, `/commande/succes`
3. Legal — `/cgv`, `/mentions-legales`, `/confidentialite`, `/livraison-et-paiement`, ported verbatim
4. Env repair and preview deploy — scope the five variables to production, rehearse in test mode
5. Go live — mode-keyed prices, 107 live prices, lift the six guards, real card, refund

**After the post, completing the agreed full scope:**

6. Content — `/commencer`, FAQ, guide des tailles, contact, à propos
7. Journal — index, post layout, 3 event recaps

Step 3 is in the Monday set because selling to French consumers without CGV, mentions légales and
a privacy policy is not lawful. It is a compliance gate, not polish.

Anything unported keeps serving from `public/` at its old `.html` URL in the old design, so no
route 404s on Monday. Redirects for those pages are added in step 6/7, when their replacements
exist — adding them earlier would break working pages.

## Risks

- **Full scope against 9 days.** Flagged at decision time and accepted. Sequencing above is the mitigation.
- **107 live prices** is a bulk write to a live Stripe account. The sync script is idempotent and
  the diff is reviewed before commit.
- **First live order is real money.** Manual Printful confirmation is the safety net.
- **EmailJS credentials are server-held.** `@emailjs/browser` remains in `package.json` but the
  server path in `functions/lib/emailjs.js` is what runs; the browser SDK must not be reintroduced
  into client components, or the private key leaks.
