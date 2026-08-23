# VertiFlow — overnight run, 22→23 August 2026

Everything is committed locally on `feature/brand-refresh-2026`. **Nothing was pushed. Stripe is still in test mode. Nothing was posted to Instagram.**

---

## Read this part first — 9 things only you can decide

Ranked by how much they cost if ignored. The first four are live on the store you are about to point 10k people at, and none of them were introduced by tonight's work.

### 1. Your CGV promises a withdrawal form that does not exist

`src/app/(legal)/cgv/page.mdx:46` reads "Formulaire de rétractation disponible [ici](#retractation)". That anchor does not exist anywhere. Under Code de la consommation **art. L221-20, failing to provide the model withdrawal form extends the withdrawal window from 14 days to 12 months.**

Roughly 20 minutes of content to fix. It is legal text, so it is yours.

### 2. Four different delivery times, and the binding one is the most optimistic

| Source | France / EU | Binding? |
|---|---|---|
| CGV §6 | **2-7 jours ouvrés (UE)** | **yes, contractual** |
| `/livraison-et-paiement` | France 3-6j, Europe 7-9j, Monde 9-15j | pre-contractual info |
| PDP, cart, success page | 5 à 10 jours ouvrés | what customers see first |
| old `public/faq.html` | a fourth set again | now replaced |

The contract promises the fastest. On print-on-demand that is a breach on most orders, and L221-5 requires accurate pre-contractual delivery information. Pick the real numbers and make all sources agree.

### 3. You advertise three shipping prices and charge one

`/livraison-et-paiement` publishes France 6,99€ / Europe 9,90€ / Monde 11,90€. But `functions/create-checkout-session.js` applies a single flat rate to every order:

```js
shipping_options: [{ shipping_rate: environment.STRIPE_SHIPPING_RATE_ID }]
```

Whichever value that rate holds, someone is charged wrong. If it is 6,99 you absorb the loss on every international order. If it is 11,90 French customers pay 70% more than you advertise. Fix by creating destination-based Stripe shipping rates, or by publishing one honest price.

The cart now says "à partir de 6,99 €" rather than a total, because no total can be guaranteed correct until you resolve this.

### 4. Your hosting declaration does not satisfy LCEN

`mentions-legales` says "Site hébergé sur www.vertiflow.fr (Détails techniques de l'hébergeur disponibles sur demande)". LCEN art. 6-III requires the host named with address and telephone. Your host is Netlify. I did not invent their details — supply the wording.

Same page is dated 01/07/2024, and that date also appears in `confidentialite` and the CGV. Bumping it touches three files.

### 5. Your products carry two different logos, and neither is the new one

Verified by looking at every mockup:
- Circular "VERTI FLOW" mark: t-shirt, casquette, coque, bob
- Plain monogram: hoodie, débardeur, cache-cou
- The refreshed site uses the **VERTIFLOW wordmark with orange FLOW**

Three marks across one grid. This is a Printful print-file question, not a code one, and it is visible on every product page.

### 6. "La première séance est gratuite"

On your homepage (`src/app/page.tsx:81`) and now repeated on `/commencer`. It is a **commercial promise about PKBA, a separate legal entity, published on VertiFlow's commercial site.** `docs/brand/narrative.md` independently lists near-identical phrasing as unsafe. If PKBA does not actually offer this, it is a false claim on two pages.

### 7. Three product photos are actively hurting you

- `short-confort-vf` — hero shows two people and a beige hoodie; the shorts are barely visible
- `bob-vf` — dominated by a black polo shirt, the bucket hat is a detail
- `debardeur-vf` — model wears bright blue shorts that fight the entire palette

Nothing in code fixes these. New Printful mockups would.

### 8. `creative/references/maxime/` is empty

Without character-lock reference photos, the AI campaign-portrait format is blocked, and so are the outstanding `home-hero` and `collection-hero` slots. This is a shoot, not a task. It is the single highest-leverage asset gap you have.

### 9. Two facts in the launch copy came from a live web fetch, not your repo

The France 3 Nouvelle-Aquitaine feature airing 15 January 2026, and PKBA's 200 m² hangar at 4 Avenue de l'Actipôle, Gujan-Mestras. Both are used in the brand copy. Confirm before anything is posted. (Your treasurer role I verified myself against your vault — that one is correct.)

---

## What shipped

33 commits, 246 tests green, clean production build, 62 static routes.

**The store** — `/boutique` with a staggered 12-column editorial grid, 9 product pages with colour-synced galleries, `/panier`, `/commande` with an embedded Stripe Payment Element, plus success and cancelled states.

**New pages** — `/commencer` (the six BRAND.md questions, previously 404ing from three places), `/journal` with three migrated event recaps, `/faq`, `/guide-des-tailles`, `/a-propos`, `/contact`.

**Legal** — CGV, mentions légales, confidentialité and livraison migrated verbatim into the new brand, verified by word-level diff against the originals.

**English** — `/en`, `/en/shop`, `/en/shop/[slug]`, with hreflang self-referencing correctly. Legal stays French-only, deliberately.

**SEO** — sitemap (35 URLs, 66 hreflang alternates), robots.txt, canonicals, Product/Organization/BreadcrumbList JSON-LD sourced from the curated media map so a blank square can never reach Google's product index. Transactional routes correctly excluded.

**Share cards** — 19 generated Open Graph images. Every product link shared to Instagram, WhatsApp or Discord now renders as a designed card instead of a bare URL, in both languages.

---

## The five bugs that would have shipped

1. **Every product image was wrong.** `data/products.json` `image_url` points at Printful *print artwork*, not mockups. Three products shared one blank white square; four resolved to unbranded stock photos. **Zero of nine rendered correctly.** Fixed with a curated local media map, plus a guard test so it cannot come back.

2. **MDX never compiled.** `@mdx-js/loader` was missing. The build passed only because no `.mdx` page existed yet — all four legal pages would have failed at build time.

3. **A dead checkout button.** The draft attached confirm with `{ once: true }`; after a declined card the button was permanently inert and only a reload recovered, losing the session. Every customer whose first card declined would have abandoned.

4. **`stripe.initCheckout` does not exist** in the installed SDK. My plan specified it, copied from your legacy code. The real API is `initCheckoutElementsSdk` → `loadActions()` → `actions.confirm()`.

5. **Your shorts were sold as cotton.** They are 91% recycled polyester / 9% spandex — verified against Printful's API. A material misdescription under art. L121-2. Now accurate, and the truth is the better story: four-way stretch, moisture-wicking, more technical than the "Performance" sibling.

Plus 10 heading-overflow bugs, a `coverImage()` landmine deleted, a footer linking to routes that never existed, and a size guide that was a **0-byte file** linked from all nine product pages.

---

## One thing I got wrong

I reported the mobile navigation as broken — a launch blocker that would kill your Instagram funnel. **It was not broken.** On this machine `--window-size=390,844` silently produces a 500px viewport, so my screenshot cropped a working menu out of frame. A debugger disproved it with a control experiment and I verified independently. The method is now banned for the rest of the run; Playwright and CDP only.

---

## Still blocked on you

**The Stripe key mode.** Everything through the redirect map is done. Going live — mode-keyed prices, the seven guard lifts, 107 live prices, the real-card test — needs to know whether `STRIPE_SECRET_KEY` is `sk_test_` or `sk_live_`.

```
! netlify env:get STRIPE_SECRET_KEY --context production | head -c 8
```

Also: production is missing five env vars that exist in `deploy-preview`. That single scoping gap is why `vertiflow.fr` checkout returns 500 today, and why it always worked when you tested a preview.

---

## Launch checklist — the store cannot take a euro until these are done

The whole-branch review's sharpest finding was about my process, not the code: **the branch reads as launch-ready and is not.** I escalated these correctly and then stopped tracking them. Collected here so that cannot happen again.

**Blocking, in order:**

1. **Tell me the Stripe key mode.** `! netlify env:get STRIPE_SECRET_KEY --context production | head -c 8`
2. **Scope four variables to production.** They exist in `deploy-preview` but not `production`, which is why `vertiflow.fr` checkout returns 500 today: `STRIPE_SHIPPING_RATE_ID`, `STRIPE_WEBHOOK_SECRET`, `EMAILJS_PRIVATE_KEY`, `EMAILJS_CUSTOMER_TEMPLATE_ID`. (`STRIPE_PUBLISHABLE_KEY` was missing earlier in the night and is now present.)

   **This does NOT affect PKBA, and requires rotating nothing.** Verified: `pkba` is a separate Netlify site (`5090be05-8582-48c9-8850-05f6acd3ae90`) from `vertiflow` (`35cbc8b8-a05e-4515-bdaf-e4f1732cdcde`). Netlify environment variables are per-site records. PKBA carries its own 18 production variables including its own `STRIPE_SECRET_KEY`, and uses Next.js naming (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `RESEND_API_KEY`, `AIRTABLE_*`) where VertiFlow uses bare names — proof they are independently configured, not team-shared. Writing to VertiFlow's site cannot touch PKBA's.

   The one action that WOULD break PKBA is **rotating the key in the Stripe dashboard**, if both sites draw on the same Stripe account. Nothing in this checklist requires that. Scoping copies an existing value; it invalidates nothing.

   Three stale names on the VertiFlow site are read by nothing in the current source and can be deleted once the rest is verified: `EMAILJS_TEMPLATE_ID`, `EMAILJS_USER_ID`, `STRIPE_SECRET_TEST_KEY`.
3. **Mode-keyed prices.** `data/products.json` still holds flat test-mode `stripe_price_id` strings. Live Stripe rejects every line item until these become `{test, live}` and 107 live Prices exist.
4. **Lift five mode guards together.** `create-checkout-session.js:25`, `get-checkout-session.js:10`, `stripe-webhook.js:643`, `stripe-webhook.js:486`, `scripts/sync-stripe-prices.js:17`. `tests/mode-guard-consistency.test.js` now FAILS if they are lifted out of step — I verified it fires by breaking one deliberately. That test is the safety net; do not delete it to make the build pass.
5. **Remove the access gate.** `create-checkout-session.js:55` returns 403 without an `x-vertiflow-test-access` header that nothing in the codebase sends. Every public request is refused today.
6. **Create a live shipping rate and a live webhook endpoint.** A test-mode `shr_` does not resolve against live keys. The webhook endpoint is `https://vertiflow.fr/api/stripe/webhook`, events `checkout.session.completed` and `checkout.session.async_payment_succeeded`.
7. **Rehearse on a preview URL, then buy something with a real card and refund it.** Seven things can only be verified against live Stripe: the success path, a declined card re-enabling the Pay button, the Modifier→resubmit path, whether `shipping_options` without `shipping_address_collection` is accepted for `ui_mode:'elements'`, a US/CA/AU checkout, promo application, and whether `payment_status` is reliably `paid` when the success page reads it.

**Operational reality for Monday:** Printful orders are created with `confirm=false`, so every paid order waits as an unconfirmed draft until you open the dashboard. And every alert — including "this order failed" — goes to one inbox through the same EmailJS provider that would be failing.

## The Stripe account is shared with two other live businesses

`acct_1Qw8utImMzY0wzqJ` (display name "vertiflow.fr") is not VertiFlow-only. Checked live with the Stripe CLI: the only LIVE products on it are "French Tech Sender - Accès Complet", "face10ai PREMIUM", and "face10ai PRO" — zero VertiFlow products. The only LIVE webhook endpoint is `https://french-tech-sender.vercel.app/api/webhooks/stripe`, subscribed to `checkout.session.completed`. The only TEST webhook endpoint is `https://face10ai.vercel.app/api/stripe/webhook`.

Stripe doesn't route an event to "the right" endpoint, it fans every matching event out to every endpoint on the account subscribed to that event type. Checklist item 6 above has you creating a live webhook at `https://vertiflow.fr/api/stripe/webhook`. The moment it exists, it will also receive `checkout.session.completed` for every French Tech Sender and face10ai sale.

**What I fixed.** Before tonight, an event for someone else's sale would fall through into VertiFlow's provenance check, come back as a `PermanentOrderError`, and fire the owner-alert email — an "order failed" email for every sale that isn't yours. `stripe-webhook.js` now checks first whether the Checkout Session carries VertiFlow's own `vf_checkout_version` metadata, stamped by `checkoutMetadata()` on every session VertiFlow creates, in both test and live mode, independent of the `vf_test_access` gate that goes away at launch. No marker means it isn't VertiFlow's: the webhook returns 200, creates nothing, emails nobody, and never reaches the code that raises an alert. A real VertiFlow session that fails provenance still alerts exactly as before, so this narrows what gets ignored instead of swallowing genuine failures.

**What's still yours to decide.** The fix only protects VertiFlow's side. Once VertiFlow is live, Stripe will just as happily fan VertiFlow's own `checkout.session.completed` events out to French Tech Sender's webhook. Whatever that handler does with a session it doesn't recognize is up to that other codebase — this repo can't see it and can't change it. The clean, permanent answer is a separate Stripe account for VertiFlow, so there's nothing left to fan out across. That's an account-level decision, not a code change.

## Operational note for Monday

Printful orders are created with `confirm=false` — every paid order sits as an unconfirmed draft until you open the dashboard. That was the deliberate choice, but it means a Monday-evening order waits until you next look. And every alert, including "this order failed", goes to one inbox through the same EmailJS provider that would be failing.
