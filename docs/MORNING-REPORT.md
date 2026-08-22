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

17 commits, 198+ tests green, clean production build.

**The store** — `/boutique` with a staggered 12-column editorial grid, 9 product pages with colour-synced galleries, `/panier`, `/commande` with an embedded Stripe Payment Element, plus success and cancelled states.

**New pages** — `/commencer` (the six BRAND.md questions, previously 404ing from three places), `/journal` with three migrated event recaps, `/faq`, `/guide-des-tailles`, `/a-propos`, `/contact`.

**Legal** — CGV, mentions légales, confidentialité and livraison migrated verbatim into the new brand, verified by word-level diff against the originals.

**In progress when this was written** — English at `/en` alongside French, then SEO (sitemap, robots, canonicals, Product JSON-LD) and generated per-product Open Graph images.

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

## Operational note for Monday

Printful orders are created with `confirm=false` — every paid order sits as an unconfirmed draft until you open the dashboard. That was the deliberate choice, but it means a Monday-evening order waits until you next look. And every alert, including "this order failed", goes to one inbox through the same EmailJS provider that would be failing.
