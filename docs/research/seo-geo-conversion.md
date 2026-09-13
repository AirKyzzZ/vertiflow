# VertiFlow — SEO, GEO & conversion research

Scope: vertiflow.fr, a 9-product French parkour-apparel micro-entreprise store (107 variants,
print-on-demand via Printful, 5–10 working days fulfilment), migrating from static HTML at
`/page.html` URLs to Next.js 16.3 App Router with 301 redirects in progress. Traffic today is
Instagram (~10k followers), not search. Every claim below is either read directly from this
repository (file:line cited) or sourced from a fetched/dated 2026 web source (linked). Where the
evidence is genuinely mixed, that's stated rather than smoothed over.

Baseline, verified directly in the repo before any research: `metadataBase` is already correctly
set to `https://vertiflow.fr` in `src/app/layout.tsx:22` — that part of the foundation exists.
Beyond that: zero `sitemap.ts`, zero `robots.ts`, zero `alternates.canonical` anywhere (checked
`layout.tsx`, `boutique/page.tsx`, `boutique/[slug]/page.tsx`, all four `(legal)/*/page.mdx`
files), and zero `application/ld+json` anywhere in `src/` or `public/` (repo-wide grep, empty).

---

## 1. Technical SEO for Next.js 16 App Router

Next.js in this repo is `16.3.0` (`package.json`), confirmed current against the live docs
(fetched `nextjs.org/docs`, `version: 16.3.2`, last updated August 2026).

### sitemap.ts

File convention confirmed live: a default-exported function returning `MetadataRoute.Sitemap`,
placed at `app/sitemap.ts`, served automatically at `/sitemap.xml`. Exact shape for this app:

```ts
// src/app/sitemap.ts
import type { MetadataRoute } from 'next'
import { getProducts } from '@/lib/catalogue'

const BASE_URL = 'https://vertiflow.fr'

export default function sitemap(): MetadataRoute.Sitemap {
  const products = getProducts()

  return [
    { url: BASE_URL, changeFrequency: 'monthly', priority: 1 },
    { url: `${BASE_URL}/boutique`, changeFrequency: 'weekly', priority: 0.9 },
    ...products.map((product) => ({
      url: `${BASE_URL}/boutique/${product.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    { url: `${BASE_URL}/livraison-et-paiement`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/cgv`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/mentions-legales`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/confidentialite`, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
```

`getProducts()` already imports the `server-only` package (`src/lib/catalogue.ts:1`); `sitemap.ts`
executes server-side only by construction, so this is safe, and it reuses the exact data source the
boutique grid already renders from — one source of truth, no drift.

Deliberately excluded: `/panier`, `/commande`, `/commande/succes`, `/commande/annulee`
(transactional, no independent SEO value, some carry per-session state — pair with per-page
`robots: {index:false}` below, not sitemap omission alone). Also excluded: the 11 legacy `.html`
pages still served from `public/` — `faq.html`, `blog.html`, `about.html`, `contact.html`,
`guide-des-tailles.html`, `accessibilite.html`, `conditions-utilisation.html`,
`propriete-intellectuelle.html`, and the three event pages (`metz-2025.html`,
`la-teste-de-buch-2025.html`, `pkba-partenariat-2025.html`) — confirmed via
`comm -23` against `src/lib/redirect-map.ts`: none of these 11 are redirected, and per
`.superpowers/sdd/2026-08-22-vertiflow-storefront-monday/task-7-additions.md`, that's deliberate —
"redirecting them now breaks working pages." A sitemap should declare canonical current content,
not the whole crawl surface; add each once it gets a real Next route, and the existing
`redirectMap()` pattern already handles the 301 at that point.

### robots.ts

```ts
// src/app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/panier', '/commande', '/api/'],
    },
    sitemap: 'https://vertiflow.fr/sitemap.xml',
  }
}
```

Do not also `disallow` the 11 orphaned legacy pages. Disallowing a page before it's 301-redirected
blocks Google from ever recrawling it to discover the eventual redirect, and some of these (old
Instagram-bio links, old backlinks) may carry existing link equity. Leave them crawlable as-is
until the follow-up plan ports and redirects them.

Sources: [Next.js — sitemap.xml](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap),
[Next.js — robots.txt](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots).

### Canonicals via generateMetadata / metadataBase

`metadataBase` (already set) lets every URL-based metadata field below use a relative path instead
of a full URL — confirmed from the live Next.js docs. None of the following exist in the repo
today; add them file-by-file:

- `src/app/page.tsx` has **no `metadata` export at all**. Add one:
  ```ts
  export const metadata: Metadata = { alternates: { canonical: '/' } }
  ```
- `src/app/boutique/page.tsx` — extend the existing object:
  ```ts
  export const metadata: Metadata = {
    title: 'Boutique',
    description: 'Neuf pièces VertiFlow, imprimées à la demande. Rien de saisonnier.',
    alternates: { canonical: '/boutique' },
  }
  ```
- `src/app/boutique/[slug]/page.tsx` — inside `generateMetadata`, add
  `alternates: { canonical: `/boutique/${slug}` }` alongside the existing `title`/`description`/`openGraph`.
- The four `(legal)/*/page.mdx` files currently export only `{ title }`. Extend each to
  `{ title, alternates: { canonical: '/cgv' } }` (etc.) — MDX's metadata export is a plain object,
  same mechanism.

**Do not** set a blanket `alternates.canonical` on the root `layout.tsx`. Per the Next.js docs'
own merging behaviour, nested fields like `alternates` are *replaced* wholesale by whichever
segment defines them, not merged key-by-key — a page that never sets its own `alternates` simply
inherits the parent's verbatim. A root-level `canonical: '/'` would silently become every page's
canonical unless explicitly overridden.

### noindex the transactional flow

`panier/page.tsx` and the three `commande/*/page.tsx` files are plain Server Components (the
client cart/checkout logic was deliberately split into `panier-client.tsx` / `commande-client.tsx`
specifically so the server page could stay a Server Component, per Ruling 14 in
`.superpowers/sdd/.../progress.md`). Each can export:

```ts
export const metadata: Metadata = { robots: { index: false, follow: false } }
```

This is better than `robots.txt` disallow alone: a disallowed URL can still surface in Google's
index as a bare, description-less link if ever discovered externally, precisely because
`robots.txt` stops Google from crawling far enough to see a `noindex` tag. Use both — `disallow`
for `/api/` (crawl-budget hygiene, never indexable anyway), `noindex` metadata for `/panier` and
`/commande/*` (cleanly removes them from the index even if something links in).

**Impact/cost:** ~45–60 minutes total for sitemap + robots + canonicals across the ~13 live
routes. This is foundational, not a growth lever on its own — but §2's structured data and §6's
hreflang both assume it exists, and without canonicals, the old `.html` history and the new clean
URLs risk being indexed as separate, competing pages during the migration window.

---

## 2. Product structured data

### The store-specific trap: don't source images from `image_url`

`data/products.json`'s `variant.image_url` field points at Printful CDN URLs that — per the
migration's own verified findings in
`.superpowers/sdd/2026-08-22-vertiflow-storefront-monday/progress.md` — resolve to blank 800×800
white squares or unbranded Printful catalogue stock photos for most of the 9 products, not photos
of VertiFlow's actual printed garments. That's exactly why `coverImage()` was deleted from
`src/lib/catalogue.ts`, every rendering surface was migrated to `src/lib/product-media.ts`'s
`mediaFor()` / `heroFor()` (the real branded mockups in `public/images/product/`), and a guard
test now fails the build if anything outside `catalogue.ts` reads `.image_url` again.

Whoever writes the Product JSON-LD will look at `data/products.json` for a ready `image` field,
find `variant.image_url`, and use it — silently reintroducing the exact blank-square bug into
Google's Merchant Listing image, in a context where Google actually fetches and validates the
image rather than a human eyeballing a screenshot. **Structured-data images must come from
`heroFor(slug)` / `mediaFor(slug, colour)`, resolved to an absolute URL — never from
`product.variants[].image_url`.**

A second, smaller trap: `formatPrice()` in `src/lib/catalogue.ts:51-53` exists to produce the
French display string (`"29,99 €"`, comma decimal, trailing symbol). Google requires `offers.price`
as a plain numeric string (`"29.99"` — "never `$19.99` or `1,350`"). Use the raw `product.price`
field from `data/products.json` (already dot-decimal, matches the schema's own
`^[0-9]+\.[0-9]{2}$` pattern) for JSON-LD, not the output of `formatPrice()`.

### Required vs. recommended, from Google's current docs (fetched live)

- **Product snippet** (classic rich result): `name` is the only hard requirement; at least one of
  `review`, `aggregateRating`, or `offers` must also be present for eligibility.
- **Merchant listing** (the shopping/price-panel experience — what actually matters for a store):
  `name`, `image`, `offers` are required; inside `offers`, `price` and `priceCurrency` (ISO 4217,
  `"EUR"`) are required. `shippingDetails` and `hasMerchantReturnPolicy` are *recommended*, not
  required — their absence can mean a plainer display, not disqualification.
- No Google Merchant Center account is required for structured-data-only eligibility; Merchant
  Center is a separate, feed-based path to the same surfaces.

Sources: [Google — Product structured data](https://developers.google.com/search/docs/appearance/structured-data/product),
[Google — Merchant listing](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing).

### Per-variant offers vs. AggregateOffer: neither — this is catalogue-specific, not generic advice

`AggregateOffer` (`lowPrice`/`highPrice`) exists to represent a *price range* across multiple
offers of one product. Every one of VertiFlow's 9 products has exactly one price regardless of
colour or size — confirmed directly in `data/products.json`: `price` is a single top-level field
on the product object, not the variant, across all 107 active variants. There is no range to
aggregate. A single `Product` → single `Offer` isn't a simplification of the correct model here,
it *is* the correct model. The newer `ProductGroup`/`hasVariant`/`variesBy` pattern (Google, Feb
2024, for catalogues where variants genuinely differ in price or image —
[docs](https://developers.google.com/search/docs/appearance/structured-data/product-variants)) is
explicitly optional even where it applies, and would add a 10–46-entry `hasVariant` array per
product for zero display benefit here. Revisit only if a future product is priced per size.

### Exact shape for a PDP

Example for `tshirt-climb`, wired into `src/app/boutique/[slug]/page.tsx`:

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "T-shirt CLIMB",
  "image": [
    "https://vertiflow.fr/images/product/front_tshirt_black.png",
    "https://vertiflow.fr/images/product/back_tshirt.webp"
  ],
  "description": "Le t-shirt qu'on porte à l'entraînement, et après.",
  "sku": "tshirt-climb",
  "brand": { "@type": "Brand", "name": "VertiFlow" },
  "offers": {
    "@type": "Offer",
    "url": "https://vertiflow.fr/boutique/tshirt-climb",
    "priceCurrency": "EUR",
    "price": "29.99",
    "availability": "https://schema.org/InStock",
    "itemCondition": "https://schema.org/NewCondition",
    "seller": { "@type": "Organization", "name": "VertiFlow" }
  }
}
```

Notes specific to this catalogue:
- `image` from `mediaFor(slug, colours(product)[0])`, not `image_url` (see above).
- `sku`: there's no human SKU in `data/products.json` (only per-variant
  `printful_catalog_variant_id` / `stripe_price_id`). Using the `slug` is honest; don't fabricate a
  GTIN/MPN that doesn't exist — Google treats these as optional, and an invented one is worse than
  none.
- `availability: InStock` holds as long as at least one variant is `active: true` — true for all 9
  products today. If a product's entire variant set is ever deactivated, this must flip.
- **Hold off on `hasMerchantReturnPolicy` and `shippingDetails`** until the delivery-time
  inconsistency in §4 is resolved. Encoding a `deliveryTime` that contradicts what three different
  pages on the live site say is worse than omitting the property — mismatched structured data vs.
  visible page content is itself a guideline problem, separate from the legal-accuracy one.

### Organization

Add once, in `src/app/layout.tsx`, as a plain script tag — there's no dedicated Next.js metadata
field for arbitrary JSON-LD; a manual `<script type="application/ld+json">` in the Server Component
is the standard, only mechanism in App Router:

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "VertiFlow",
  "url": "https://vertiflow.fr",
  "logo": "https://vertiflow.fr/images/logo-transparent.png",
  "sameAs": ["https://www.instagram.com/vertiflowfreerun/"]
}
```

Deliberately omit `address`. `src/app/(legal)/mentions-legales/page.mdx` confirms the SIRET address
(30 cours Henri Brunet, 33000 Bordeaux) is a registered office, not a shop — French law requires it
in *mentions légales* text, but there's no requirement (and no upside) to also put it in globally
machine-harvestable JSON-LD for an entity nobody can walk into.

### BreadcrumbList

Worth adding on PDPs — low cost, modest but real SERP benefit (a breadcrumb trail instead of a raw
URL):

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://vertiflow.fr" },
    { "@type": "ListItem", "position": 2, "name": "Boutique", "item": "https://vertiflow.fr/boutique" },
    { "@type": "ListItem", "position": 3, "name": "T-shirt CLIMB" }
  ]
}
```

### LocalBusiness: no — wrong type, not a style choice

`LocalBusiness` is for an entity with a physical location the public visits, or a defined service
area a business travels to. VertiFlow is online-only; the SIRET address is a registered office.
`BRAND.md`'s own "entity boundary" section is explicit that PKBA (the club, which does have a real
physical training presence) is "a separate entity" and copy "must never read as though they are
one organisation" — marking VertiFlow up as `LocalBusiness` would blur precisely the line the brand
doc insists on keeping sharp, on top of being semantically wrong. `Organization` is correct.

Related finding, worth surfacing here since it bears on §5's "social proof" question too: Google's
structured-data policy (most recently reinforced in a December 2025 update) makes **`LocalBusiness`
and `Organization` review markup on your own site ineligible for star-rating rich results** when
the entity being reviewed controls the reviews — a homepage testimonials block with
`AggregateRating` would never show stars, even with genuine quotes. `Product`-level `Review` /
`AggregateRating` on PDPs is exempt from that restriction. So real product reviews, whenever they
exist, belong nested under the `Product` schema above, not as an `Organization`-level block.

**Impact/cost:** Product+Offer JSON-LD across 9 PDPs (reusing data already resolved in
`generateMetadata`) is roughly an hour. Organization is a 10-minute one-time addition. This is a
direct, mechanism-backed path to Merchant Listing eligibility — unlike §3 below, there's an
established causal link here, not just a hoped-for one.

---

## 3. GEO — generative engine optimisation

### llms.txt: skip it — this is now evidenced, not a guess

A [2026 SE Ranking study of 300,000 domains](https://organikpi.com/blog/distribution/llms-txt-adoption-impact/)
puts adoption at ~10% after roughly eighteen months of industry conversation — and usage matters
more than adoption: GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot and Google-Extended
overwhelmingly don't fetch `/llms.txt` at all, they crawl HTML directly. Google has said so on the
record: Gary Illyes confirmed Google doesn't support it and has no plans to, and John Mueller
compared it to the meta-keywords tag. An XGBoost model built to predict AI-citation likelihood from
site features found that *removing* the llms.txt variable *improved* prediction accuracy — in that
dataset the file is noise, not signal. ([codersera.com](https://codersera.com/blog/llms-txt-complete-guide-2026/),
[presenc.ai](https://presenc.ai/research/state-of-llms-txt-2026)) It does help IDE coding agents
(Cursor, Continue, Cline) reading documentation sites — irrelevant to a storefront. Cost of adding
one is near-zero; so is the benefit. Not worth the file existing.

### Structured data and AI citations: the rigorous study contradicts the marketing claims

The most credible data point available is [Ahrefs' controlled test](https://marcodiversi.com/blog/does-schema-help-ai-citations/):
schema added to 1,885 pages, tracked against 4,000 matched controls that didn't get it. Result: AI
Overview citations moved −4.6%, AI Mode +2.4%, ChatGPT +2.2% — "statistically indistinguishable
from zero." That directly contradicts uncontrolled vendor-blog claims circulating alongside it
("2.5x higher AI citation rates," "44% increase") — those read as correlation (sites with complete
schema also tend to be larger, more authoritative, more frequently updated — schema isn't the
variable doing the work). Google's own stated position: no special schema is needed to appear in
AI Overviews or AI Mode. The narrower, defensible claim from Google is that schema feeds the
entity-understanding layer Gemini/AI Mode uses to verify claims and assess source credibility
during synthesis — real, but indirect and marginal, not a lever you pull for a citation increase.

**Practical read for VertiFlow: implement §2's Product/Organization schema because it's required
for an established, direct mechanism (Merchant Listing eligibility) — not on any expectation it
will get VertiFlow cited by ChatGPT.** Anyone selling "AI-optimized schema" as a separate GEO
service on top of what §2 already does is selling the same JSON-LD twice.

### How the four platforms actually source things — and what that implies at this store's scale

- **Google AI Overviews** generate from Google's own organic index — a page ineligible to rank
  classically is ineligible to be cited in an AI Overview for that query either. This makes §1
  (sitemap/robots/canonicals) the single highest-leverage GEO action available: there is no AI-search
  shortcut around basic indexability.
- **Perplexity** runs a live web search on every query and cites inline from what it reads — the
  most directly SEO-adjacent of the four, and the most measurable: [100% of Perplexity citations
  are clickable links](https://www.digitalapplied.com/blog/ai-visibility-tools-2026-track-brand-chatgpt-perplexity-gemini),
  so `perplexity.ai` referral traffic shows up cleanly in ordinary analytics.
- **ChatGPT** answers mostly from training data, searches selectively, and skews toward
  high-authority sources when it does cite. A 2026 study of 34,234 responses found ChatGPT cites
  brands only 0.59% of the time vs. Perplexity's 13.05% — a 46x gap — and [only ~20% of ChatGPT's
  brand mentions are even clickable](https://www.getpassionfruit.com/blog/how-to-monitor-your-brand-across-chatgpt-perplexity-and-ai-search),
  so a chunk of any visibility there wouldn't show up in analytics even if it existed.
- Across all of them, per an [analysis of 680M citations](https://www.leapd.ai/blog/ai-visibility/how-chatgpt-google-ai-overviews-and-perplexity-source-information-in-2026),
  only 11% of domains are cited by both ChatGPT and Perplexity — each runs different logic. What
  earns a citation across platforms is a **consensus signal**: the same brand, described
  consistently, appearing across independent sources you don't control (Reddit, YouTube, press,
  review sites) — not just your own site.

### What's concretely achievable here, honestly ranked

The France 3 Nouvelle-Aquitaine TV segment referenced in `BRAND.md`'s timeline and on the homepage
(`page.tsx`'s `timeline` array) is exactly the independent third-party asset that builds a
consensus signal — if a URL for that segment exists, link it from `/a-propos`; it's worth more to
GEO than any amount of schema tuning, precisely because VertiFlow doesn't control it. Beyond that:
there's currently no live blog, no live FAQ (it's one of the 11 orphaned static pages), and no
reviews — none of the raw material GEO needs yet exists in citable form. FAQ-formatted content
(real question, 50–150 word answer, one heading per pair) has the best-evidenced extractability
rationale of any specific format, and `BRAND.md` already has a ready outline for it: "the six
questions `/commencer` answers, in order" *is* a FAQ. Porting `faq.html` to a real route with
`FAQPage` schema serves real user utility and the one content format GEO research consistently
flags — but it's a content-writing task for the follow-up plan, not tonight's code.

### Is any of this measurable, honestly?

Partially. Perplexity: yes, cleanly, via referrer segmentation on `perplexity.ai` in whatever
analytics VertiFlow runs — free, no new tooling. ChatGPT: no, not reliably, for the reason above.
Dedicated AI-visibility platforms exist (Profound, Otterly, Ahrefs Brand Radar, Semrush's AI
toolkit) but are paid SaaS built for teams tracking share-of-voice at a scale this store isn't at —
recommend against subscribing to any of them now. The honest, cheap substitute: periodically typing
"vêtements parkour France" style queries into ChatGPT, Perplexity and Google AI mode by hand and
noting whether VertiFlow appears — a five-minute quarterly check, not a workflow.

**Overall verdict: do nothing GEO-specific tonight beyond what §1 and §2 already deliver for other
reasons.** Traffic is Instagram, not search; the consensus-signal mechanism that actually drives AI
citation is a content/PR asset this store doesn't have at scale yet; and the one lever that would
matter — being indexable and ranking classically at all — is already covered as baseline technical
SEO, not a GEO line item.

---

## 4. French-market specifics

### TTC vs. HT

Legal requirement is unambiguous: DGCCRF/economie.gouv.fr require all consumer prices shown "en
euros et toutes taxes comprises (TTC), de manière visible et compréhensible," regardless of channel
([economie.gouv.fr](https://www.economie.gouv.fr/particuliers/mes-droits-conso/bien-consommer/affichage-des-prix-ce-que-vous-devez-savoir)).
VertiFlow-specific: as a micro-entreprise under the *franchise en base de TVA* (art. 293 B CGI), no
VAT applies at all — TTC and HT are the same number — but the specific mention **"TVA non
applicable, art. 293 B du CGI"** is still mandatory. Verified present in `cgv/page.mdx:20`. Verified
*absent* everywhere prices actually appear: `checkout-form.tsx:295` shows a bare "Prix TTC" with no
293B qualifier, and neither `product-purchase.tsx` nor `panier-client.tsx` mention tax treatment at
all. Low-severity gap (CGV satisfies the letter of the law) — worth a one-line addition near the
footer, not urgent tonight.

### Mandatory legal pages

`mentions-legales`, `cgv`, `confidentialite` are live, footer-linked, and per the migration's own
review (`.superpowers/sdd/.../progress.md`, Task 6) verified word-for-word faithful to the
pre-migration text including SIRET/SIREN/APE/médiation. Two concrete gaps worth naming here (for
the same follow-up plan, not a fix in this research):
- `livraison-et-paiement/page.mdx` has zero payment content despite the route name and footer label
  — it's exclusively shipping/production (times, carriers, a tracking FAQ). French shoppers
  routinely check payment methods on a dedicated page before checkout; this page's name promises
  that and doesn't deliver it.
- Three different delivery-time claims currently disagree: `cgv/page.mdx:37` says "2-7 jours ouvrés
  (UE)"; `livraison-et-paiement/page.mdx`'s table says France 3-6j / Europe 7-9j / Monde 9-15j;
  `product-purchase.tsx:23` and `panier-client.tsx:107` both say "5 à 10 jours ouvrés." Make the
  number shown at the two highest-visibility, most-recently-written touchpoints (PDP + cart: 5–10
  jours ouvrés) canonical, and correct the other two — a trust and legal-accuracy issue (delivery
  date is mandatory pre-contractual information under Code de la consommation art. L221-5), and a
  pure content fix.

### Droit de rétractation — the sharpest finding in this section

Under Code de la consommation, the *formulaire type de rétractation* (standard withdrawal form,
[Annexe à l'article R221-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032887061))
isn't optional boilerplate. Its absence has a specific statutory consequence: per **art. L221-20**,
the 14-day withdrawal window automatically extends to **12 months** if the merchant never actually
provides the form, reverting to 14 days only once it's eventually supplied. Separately, failing to
provide it (or providing a non-conforming one) carries a nominal penalty of up to 2 years'
imprisonment and €150,000 — rarely enforced at this scale, but the 12-month exposure is real and
operational. `cgv/page.mdx:46` currently reads "Formulaire de rétractation disponible
[ici](#retractation)" — verified directly: **no `id="retractation"` anchor exists anywhere in that
file.** The link points at nothing, meaning the form isn't actually being provided, which is the
exact condition that triggers the 12-month extension. Fix is a content addition, not a design
problem — the standard form is short (seller name/address, order-reference fields, one sentence of
withdrawal notice, date/signature); adding it under a real `#retractation` anchor is realistically
a 20-minute task.

### Delivery expectations

French shoppers expect fast delivery in a way that doesn't map to POD reality, and no copywriting
closes that gap — only clear, early expectation-setting does. [68% of French shoppers expect
delivery under 3 days for everyday purchases](https://www.ecommercemag.fr/logistique-1222/strategie-logistique-2177/logistique-livraison-et-retours-e-commerce-panorama-et-acteurs-2026-58027)
(a 48h threshold for 45% of 25-34 year-olds); Colissimo hits 48h for 70% of parcels, Chronopost
hits J+1 90% of the time in metropolitan France. Against that baseline, VertiFlow's honest 5–10
jours ouvrés reads slow by local norms regardless of phrasing. The site already does the right
structural thing — `FULFILMENT_NOTE` sits directly under the price on the PDP and again on the
cart, before commitment, not buried in a footer. Protect that placement as the template for every
future product-facing surface rather than "fixing" it.

### Payment methods

Card (via Stripe) is the correct backbone — Carte Bancaire is the default French trust assumption
— but "is card enough" has a sharper answer than "yes." FEVAD's 2026 figures show French buyers use
an average of 4.6 different payment methods and [54% pay via smartphone
regularly](https://www.fevad.com/les-chiffres-sur-les-nouveaux-paiements-nouveaux-usages/) —
disproportionately relevant given traffic arrives from the Instagram app on a phone.
`checkout-form.tsx` already uses Stripe's Payment Element (`ui_mode: 'elements'`, confirmed in
`functions/create-checkout-session.js:62-63`), which surfaces Apple Pay/Google Pay automatically
once eligible — but Apple Pay specifically requires the domain to be registered with Stripe (a
`/.well-known/apple-developer-merchantid-domain-association` file plus a Dashboard step), exactly
the kind of thing that silently doesn't work until someone checks it once.
**Action: confirm in Stripe Dashboard → Settings → Payment methods whether `vertiflow.fr` is
registered for Apple Pay; if not, five minutes of work with outsized effect given the mobile-first
traffic source.** PayPal remains a recognized French trust icon even alongside card, but at
VertiFlow's price points (€19.99–€64.99) it's "nice, not urgent." BNPL (Alma/Klarna/Oney "3x/4x") —
FEVAD's "1 in 2 have used installment payment" is real but concentrated at higher ticket sizes;
skip it here, it's integration cost without matching demand at this catalogue's prices.

---

## 5. Conversion patterns for a 9-product apparel store

Baymard's cross-study average puts cart abandonment at ~70%
([baymard.com/lists/cart-abandonment-rate](https://baymard.com/lists/cart-abandonment-rate)), with
these as the top named, addressable reasons (browsing-only abandonment excluded): extra costs too
high (40%), delivery too slow (20%), card-info distrust (19%), forced account creation (18%),
checkout too long (17%), site errors (17%), unsatisfactory returns policy (13%), can't see total
cost upfront (12%), card declined (10%), insufficient payment methods (9%). Ranked by evidenced
impact against effort, mapped directly onto what's actually in this repo:

**1. Cart defers the one number responsible for ~52% of named abandonment reasons combined
(highest impact, lowest cost).** `panier-client.tsx:154-156` shows only a "Sous-total" and *"Livraison
calculée à l'étape suivante"* — shipping cost is explicitly deferred to `/commande`, one step later.
Baymard's #1 reason is "extra costs too high" (40%); #8 is "unable to see/calculate total cost
upfront" (12%) — together the largest addressable share of the 70% baseline. VertiFlow's shipping
is flat and known for the dominant case (6,99€ France, per the `livraison-et-paiement` table) —
nothing technical prevents showing it on `/panier` itself, before the customer commits to an
address. This isn't a hidden-fee problem (cost is disclosed before payment, better than the worst
version of this pattern) — it's "disclosed one click later than necessary, at exactly the point
research says people leave." Cost: trivial. Impact: targets the two largest named drivers directly.

**2. `/guide-des-tailles.html` is a genuinely empty file, linked from every single PDP.** Verified:
`public/guide-des-tailles.html` is **0 bytes**. `product-purchase.tsx:80-85` links to it on all 9
product pages, directly below the size picker — exactly where a hesitating buyer clicks. Sizing
uncertainty matters disproportionately for POD apparel specifically (garment blanks vary by
supplier, no store history/reviews exist yet to substitute for it). This is Baymard's
"unsatisfactory returns policy" driver (13%) one step upstream — the tool meant to prevent the
return doesn't exist. Cost: medium (needs real per-garment measurements: t-shirt/hoodie/tank/
shorts/cap are different Printful blanks with different charts) — content work, first in the queue,
not a tonight fix.

**3. Traffic is 100% warm Instagram right now — message-match the landing.** Warm audiences
tolerate direct messaging that would repel cold traffic, and [landing pages with 90%+ message match
to the referring post convert 2.3x better than generic
pages](https://foursixty.com/blog/convert-instagram-traffic-into-shopify-sales/) — losing a
qualified click by landing it on `/boutique` instead of the exact PDP (and colourway) shown in the
post is the most avoidable leak for a store whose entire current audience arrives this way.
Concretely: every Instagram bio link / swipe-up featuring a specific product should point straight
at `/boutique/{slug}`, not the homepage. Optional small enhancement: reading an initial colour from
a URL query param in `product-purchase.tsx`'s `useState(palette[0])` so a post about the black
hoodie lands with black pre-selected. Cost: near-zero (mostly linking discipline; the query-param
piece is ~15 minutes). Impact: plausibly the largest single item here, because it affects 100% of
current traffic, not a future organic slice.

**4. No reviews to show — the honest substitutes already exist in the repo.** With zero reviews,
fabricating `AggregateRating` isn't just against Google's guidelines (§2) — self-served
`Organization`/`LocalBusiness` review markup is ineligible for star rich results regardless, so
there's no structured-data shortcut at all. Credible substitutes: (a) the founder-athlete story —
eight years of FFG national competition, a real 80-member association, a France 3
Nouvelle-Aquitaine TV segment — is already used on `/`, but absent from the PDP itself, where a
first-time buyer actually decides; a one-line trust strip costs nothing and belongs there too. (b)
UGC from the ~10k Instagram followers is a legitimate review substitute, and the raw material
already exists under `creative/instagram/` — a small "vu sur Instagram" strip does more for a
zero-review store than a review-widget integration would. (c) For later, not now: once reviews
start arriving, a review or two with minor criticism reportedly converts better than a
filtered all-5-star feed — don't over-curate when that day comes.

**5. Checkout is already guest-only — a real, quiet win worth protecting.**
`checkout-form.tsx`'s `ShippingForm` has no password/account field, and the legacy
`sign-in.html`/`sign-up.html` were deliberately redirected to `/` rather than ported
(`src/lib/redirect-map.ts:26-27`) — the migration already made the call Baymard's data supports
(forced accounts drive 18% of abandonment). Nothing to fix — flagging it so it doesn't get
"fixed" back in later without checking this research first.

**Not recommended: AR/virtual try-on for apparel.** Surfaced in generic POD-conversion content with
a suspiciously specific "22% conversion lift" figure that reads as vendor case-study material, not
independent research. Wildly disproportionate build cost for a 9-product micro-entreprise store
regardless of whether the number is real.

---

## 6. i18n and SEO (adding English)

### Subpath, not subdomain, not a separate domain

Not close, at this size. Google's mechanics-level position is genuinely neutral (Mueller: "fine
with either... use what works best for your setup"), but VertiFlow has no spare domain authority to
split — there's currently no sitemap, no robots.txt, no canonicals, and zero organic visibility to
protect, which makes a subdomain's well-documented tendency to be treated as a semi-distinct entity
actively counterproductive rather than neutral here. A subpath (`vertiflow.fr/en/...`) consolidates
whatever authority accumulates going forward, costs nothing extra to host, and is what small-
ecommerce guidance converges on for exactly this reason
([backlinko.com](https://backlinko.com/subdirectory-vs-subdomain),
[ahrefs.com](https://ahrefs.com/blog/subdomain-vs-subfolder)). A separate ccTLD/`.com` is
unnecessary cost and a third authority silo — reject outright at this scale.

### Next.js App Router mechanics

App Router dropped the Pages Router's built-in `i18n` config; there's no first-party routing
solution anymore. For one additional language across ~9 product pages plus a handful of content
pages, the pragmatic options are a manually duplicated `/en/` route tree, or `next-intl` (the
current App-Router-native community standard) if the manual approach starts drifting. Either way,
the SEO-critical part is the same and is worth stating precisely, since it's the part most often
gotten wrong: **every localized page must declare `alternates.languages` pointing at every version
of itself, including itself** — e.g. on `/boutique/tshirt-climb`:

```ts
alternates: {
  canonical: '/boutique/tshirt-climb',
  languages: {
    'fr-FR': '/boutique/tshirt-climb',
    'en-US': '/en/shop/tshirt-climb',
    'x-default': '/boutique/tshirt-climb',
  },
},
```

and the English page must carry the mirror of that same block, not just a canonical back to French.
[96% of sites with hreflang conflicts are missing exactly this self-referencing
tag](https://fridamarketing.com/seo/technical-seo/hreflang-complete-guide-nextjs-2026) — the single
most common way hreflang breaks, and it breaks silently (no build error, just wrong search
behaviour). §1's `sitemap.ts` should carry the same `alternates.languages` per URL too — the
sitemap file convention supports this natively (confirmed from the live docs: each entry accepts
`alternates: { languages: {...} } }`, emitted as `<xhtml:link rel="alternate" hreflang="...">`
inside `sitemap.xml`). Doing it in both the sitemap and each page's `<head>` is redundant but both
are explicitly supported, and centralizing it in one file is easier for a one-person team to keep
in sync than trusting every page component to remember it.

One concrete code trap for whenever this actually gets built: `src/app/layout.tsx:33` hardcodes
`<html lang="fr" ...>` in the single root layout every route shares. Correct today (100% French
site); will need to become locale-conditional the moment `/en/` routes exist.

### Does English risk diluting French rankings?

Not algorithmically, if hreflang/canonical is done correctly — reciprocal, self-referencing
hreflang plus per-language canonicals exist specifically to stop search engines treating `/en/...`
and `/boutique/...` as duplicate or competing content. The real risk isn't algorithmic dilution,
it's **founder-time dilution**: every hour spent translating and maintaining a second language
competes directly with the French foundation and conversion work in §1–§5, for a store whose entire
current audience is a French Bassin d'Arcachon/Bordeaux Instagram following. Since the brief itself
notes phone cases and caps "could sell wider," a cheaper sequencing exists: **scope English
initially to those wide-appeal, non-France-specific SKUs** rather than the full catalogue (parkour
apparel sized to a French audience, shipped from a France-oriented rate table, has a narrower
English-speaking buyer anyway) — cuts translation/maintenance surface roughly in half for most of
the plausible upside. Build English once French organic shows measurable traction, or a concrete
non-French demand signal appears (Instagram audience geography, an actual non-FR order) — not on a
fixed timeline.

---

## Priority: tonight / defer / skip

### Implement tonight
1. `src/app/sitemap.ts` + `src/app/robots.ts` (§1) — ~30 min. Foundational; unblocks everything else.
2. `alternates.canonical` on the ~13 live routes (§1) — ~20 min. Prevents old-vs-new URL duplicate-content confusion mid-migration.
3. `robots: { index: false }` on `/panier` and the three `/commande/*` pages (§1) — ~10 min.
4. Show the France shipping rate on `/panier` itself instead of deferring to `/commande` (§5.1) — targets the two largest named Baymard abandonment drivers; trivial UI change.
5. Fix the `#retractation` anchor in `cgv/page.mdx` — add the real withdrawal-form text (§4) — currently promises a form it doesn't deliver, with a real 12-month legal-exposure consequence; the form is short enough to write directly tonight.
6. Product + Organization + BreadcrumbList JSON-LD (§2), sourcing images from `mediaFor()`/`heroFor()` and raw `product.price`, never `variant.image_url` or `formatPrice()` — ~1 hour; established path to Merchant Listing eligibility.
7. Reconcile the three conflicting delivery-time figures (CGV / livraison-et-paiement / PDP+cart) to one number (§4) — pure content edit, removes a real trust and legal-accuracy problem.
8. Confirm Apple Pay domain registration in the Stripe Dashboard (§4) — five minutes, outsized effect given mobile/Instagram traffic.

### Defer to the follow-up plan
- Port `faq.html`, `guide-des-tailles.html` (currently 0 bytes), `about.html`, `contact.html`, `blog.html` and the three event pages to real Next routes, then extend `redirectMap()` and `sitemap.ts` (§1, §3, §5). Content work — especially the size guide, which needs real measurements — plus routing, not a quick edit.
- `FAQPage` schema once `faq.html` is actually ported with real content (§3) — the best-evidenced GEO-relevant format available, but there's no live page to attach it to yet.
- PDP trust strip referencing the founder/club story, and an Instagram UGC strip (§5) — needs a small design decision, not just code.
- English section, scoped first to wide-appeal SKUs (phone cases, caps) rather than the full catalogue (§6) — a sequencing call, do it after the French foundation ships and shows signal.
- The `?couleur=` query-param enhancement for Instagram-linked PDPs (§5) — nice-to-have, not blocking.

### Skip entirely
- **llms.txt** (§3) — Google explicitly doesn't support it, major AI crawlers largely don't fetch it, and the best available correlation study found it adds noise, not signal. Zero evidenced upside for any effort.
- **Paid "GEO"/AI-visibility tooling or agency packages** (§3) — built for teams tracking share-of-voice at a scale this store isn't at; a quarterly manual check of ChatGPT/Perplexity/Google AI mode is the honest substitute.
- **AR/virtual try-on** (§5) — the conversion-lift figure behind it reads as vendor marketing, not independent research; build cost is disproportionate to a 9-product store regardless.
- **BNPL (Alma/Klarna/Oney "3x")** (§4) — real French demand, concentrated at higher price points than VertiFlow's €19.99–€64.99 catalogue; integration cost with no matching need now.
- **`ProductGroup`/`hasVariant`/`AggregateOffer`** (§2) — the correct model for variant-invariant pricing is a plain `Product`/`Offer`; the elaborate schema solves a price-range problem this catalogue doesn't have.
- **Subdomain or separate ccTLD for English** (§6) — would split authority the site doesn't have yet to spare; subpath is strictly better at this scale.
