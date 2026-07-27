# VertiFlow brand refresh — September 2026

Date: 2026-07-27
Status: approved design

## Objective

Un-freeze VertiFlow deliberately as a community brand, not an income venture. Refresh
its identity, rebuild its website on Next.js, launch one collection into the September
*rentrée*, and leave behind a content engine that runs on one hour a week.

The purpose is federation: getting people into parkour, and giving the people already in
it something to belong to. Revenue is explicitly not a success metric.

## What this is not

- Not a revenue play. VertiFlow does roughly €15–20/month and that is not the thing being
  fixed.
- Not competing with `klyx-estate`, which remains the independent-income bet. VertiFlow
  and klyx-estate run in parallel and this design accounts for that.
- Not a rebrand in the naming sense. `VertiFlow`, `vertiflow.fr` and the circular VF mark
  survive. "Refresh" means building an identity system where none currently exists.

## Positioning

**The door into parkour, with the credibility to keep you once you're serious.**

Two halves that resolve into one rule: *production value signals performance, subject
matter holds the door open*. Serious craft — disciplined typography, real photography —
applied to beginners, daylight sessions, and people missing jumps.

The founder story is the proof of both halves and cannot be copied by competitors: eight
years FFG at national level, founder of a club with 80+ licenciés, covered by France 3
Nouvelle-Aquitaine. The performance credential is real, and the club takes people who have
never jumped anything.

Market context: two to three real French parkour brands exist nationally. The category is
uncontested enough that a founder with 10k followers, an athlete record and a club has
room. Local first, national in 2027.

## Success test

Fixed on 2026-07-27 so it cannot move.

| | |
|---|---|
| **The test** | 15 first-time attendees at a PKBA session by 31 December 2026 who say they came via VertiFlow or its Instagram |
| **Measurement** | One field on the découverte form — *"Comment tu nous as connus ?"* — persisted to PKBA's existing Airtable. No engineering required. |
| Leading indicator | `/commencer` form submissions |
| Diagnostic | Instagram bio-link clicks |
| **Not a metric** | Revenue, follower count, post volume |

The real failure mode is zero, not fourteen. Any non-zero attributed number proves the
mechanism works and makes 2027 a scaling problem rather than a validation one.

## Constraints

- **Time:** ~4h/week during August. From September, 1h/week sustained baseline plus
  discretionary bursts around events. The alternance goes full-time, EPSI resumes and GDC
  Geneva lands in early September.
- **Parallel work:** `klyx-estate` runs at the same time throughout. The plan must survive
  being one of two things, not require clear weeks.
- **PKBA is capped.** `vision-2026` instructs minimum viable presence and guarding against
  time creep. Growth driven by this work must not land as club admin on Maxime's desk.
- **Money:** effectively zero budget. Free fonts, free tooling, no inventory, no ad spend.
- **Fulfilment:** pure print-on-demand via Printful. No inventory is ever held and no order
  is ever packed by hand.

## Identity system

Deep enough for one collection. Not a brand book.

**Colour — six tokens.** Near-black base (already the garment base), warm off-white paper,
a neutral ramp, and one accent: sodium-amber, taken from Maxime's own existing campaign
direction (*"warm train-window glow", "Bangkok amber light"*). Streetlight amber is the
hour people actually train and it is warm where every competitor is cold. The iridescent
carabiner spectral is reserved for garment graphics only, where it cannot damage UI
contrast.

**Type.** Archivo Expanded for display — wide, technical, confident without shouting.
Inter retained for body. Both free and variable. Inter alone, the current state, says
nothing.

**Art direction — five rules.**

1. Real named spots: La Teste, Gujan, Bordeaux. Never generic urban.
2. Beginners and ordinary bodies in frame, not only clean elite lines.
3. Shot at the hours people train: golden hour, dusk, sodium night.
4. **Show the miss, not only the make.** This is the door rule and it does most of the work.
5. AI imagery for product and campaign renders only. Never for anything implying a real
   person at a real session. The entire test is that strangers physically turn up; a
   fabricated athlete at a fabricated spot would poison it.

**Tone.** French, tutoiement, short sentences. Never assume the reader can already do
anything.

**The system of record is split in two, deliberately.** `brand.tokens.json` holds the
machine-readable values — colours, type scale, font stacks — and the Tailwind config
imports it, so no token is ever typed twice. `BRAND.md` at the repo root holds everything
prose: the positioning line, tone rules, the five art-direction rules, the six questions
`/commencer` answers, and a pointer to the tokens file. The content agent reads `BRAND.md`.
Markdown cannot configure Tailwind and JSON cannot express tone; each file does the job it
can actually do.

## Website rebuild

**Stack.** Next.js App Router, TypeScript strict, Tailwind, shadcn/ui. Matches PKBA, so
one mental model covers both sites.

**Hosting stays on Netlify.** No DNS move, and `pkba.vertiflow.fr` — which carries PKBA's
entire registration and licence funnel — is never at risk during the rentrée window.
Requires `@netlify/plugin-nextjs`; the publish directory moves off `public/`, which makes
most of the hand-tuned cache headers in `netlify.toml` redundant.

**Migration happens on a branch.** `main` keeps serving the live site until cutover.
Netlify branch deploys provide a preview URL for review at any point.

**No database.** Stripe is the order record, Printful is the fulfilment record, and
deleting the sign-in/sign-up pages removes the only thing that wanted accounts. The
catalogue is a typed object generated by the Printful sync script.

**Route collapse.**

| Now | After |
|---|---|
| 9 hand-written product pages + `product-detail.html` + `details-produit.html` | `/boutique` + `/boutique/[slug]` |
| `blog.html` + 3 article pages | `/journal` + `/journal/[slug]`, MDX |
| `sign-in.html`, `sign-up.html`, `no-color.html` | deleted |
| 6 legal pages | one shared layout, content ported as-is |
| `about.html` | `/a-propos` |
| — | `/commencer` — new |

~25 files become ~14 routes, two of them dynamic. **Adding a collection becomes adding
catalogue data, not authoring pages.** That is the point of the migration.

**Netlify functions become Route Handlers**, wrapping the existing `functions/lib/` modules
unchanged. Price authority is already server-owned on `origin/main` via `resolveCart`
against `data/products.json`, so no security work is needed here — the migration must
simply not regress it. The 12 existing tests are the guard.

**The branch must be rebased onto `origin/main` before any migration work.**
`feature/brand-refresh-2026` descends from the pre-pipeline main and contains none of the
commerce implementation.

**Every existing URL gets a 301.** All ~25 pages including legal, via Netlify `_redirects`.
Losing accumulated search equity would directly damage the journal channel.

## Commerce and publish pipeline

**This is already built and merged to `origin/main`.** The 2026-07-17 spec was implemented,
not merely written. Present on `origin/main`:

- `data/products.json` — server-owned catalogue, schema v2, generated 2026-07-17, carrying
  real Printful sync variant IDs and Stripe product IDs, plus `products.schema.json`
- `functions/lib/` — `catalogue.js` (`resolveCart`, `validateCustomer`),
  `printful-orders.js`, `checkout-provenance.js`, `emailjs.js`
- `functions/` — `create-checkout-session.js`, `get-checkout-session.js`,
  `stripe-webhook.js`, `create-payment-intent.js`
- `scripts/` — `sync-printful-catalogue.js`, `sync-stripe-prices.js`
- **12 test files** under `npm test` (`node --test tests/*.test.js`)

**The migration is therefore a port, not a rebuild.** `data/`, `functions/lib/`, `scripts/`
and all 12 tests carry across unchanged. Only the thin Netlify function wrappers become
Route Handlers. The tests are the safety net for the port and must keep passing throughout.

**Unmerged work exists.** Seven commits on `codex/commerce-main-release` (shared EmailJS
template, Stripe Elements UI mode, additional tests) sit ahead of `origin/main`. Land or
drop them before the migration starts, so the port has one source of truth.

## Going live

Not previously identified, and it gates the September drop.

The storefront **cannot take a real payment today**, by design:

- checkout is gated behind an `x-vertiflow-test-access` header matched against
  `VERTIFLOW_TEST_ACCESS_TOKEN`
- `validateEnvironment` throws `'Live Stripe keys require a live catalogue'` for any
  non-test Stripe key, so live keys are refused outright
- `data/products.json` carries test-mode Stripe identifiers

**This is not a configuration change.** `docs/commerce-catalogue.md` is explicit:

> "There is no supported live-sync toggle in current code; do not add one as an environment
> workaround." … "A future live path must be implemented and reviewed deliberately; it is
> not enabled by changing environment values."

The fence is three independent layers:

- `scripts/sync-stripe-prices.js` — `assertSafeStripeKey` rejects any key not prefixed
  `sk_test_` or `rk_test_`
- `functions/create-checkout-session.js` — `validateEnvironment` throws on live keys, and
  checkout additionally requires a valid `x-vertiflow-test-access` header
- `functions/stripe-webhook.js` — live-mode Sessions are acknowledged with no Printful or
  email side effects

Implementing the live path is a distinct, security-sensitive project spanning
reconciliation, checkout and webhook, carrying its own review, and governed by the
runbook's rollback procedure and replay/failure matrix. It is **not** a task inside this
refresh and must not be rushed to hit a drop date.

**Decision recorded:** there is one launch. The new site, the new collection and a working
live shop ship together. The launch date therefore follows readiness rather than the
calendar, and the live payments path is in scope for this refresh as its own reviewed
workstream — sequenced and reviewed on its own terms, never compressed to hit a date.

**Consequence, and its mitigation.** Coupling the launch to a payments security project
means the rentrée window will probably be missed, and the rentrée is the highest-intent
window of the year for the December test. The mitigation is cheap and does not split the
launch: **`/commencer` ships on the current static site in late August** — one Bootstrap
page carrying the door message and the découverte form. Counting starts during the rentrée
regardless of when the new site lands, and the page is deleted at cutover.

The creative loop this produces:

    new artwork → upload to Printful → run sync → catalogue updates
                → product page exists, in its collection, with mockups

No HTML authoring. This is the difference between a collection costing a weekend and a
collection costing an evening, and it is the leverage that makes the brand sustainable at
one hour a week.

`collection` becomes a field on the catalogue item. `/boutique` groups by it, which is what
lets a drop read as an event rather than four more rows in a grid.

## The funnel

    Instagram post → profile → link in bio → /commencer
                   → "je viens à une séance" → Airtable
                   → PKBA owner has a list → person attends → ticked

**`/commencer` is the most important page on the site.** It answers six questions in this
order: what is this, can I do it, where, when, what does it cost, will I be the worst one
there. No hero video, no origin story — that page has one job.

**The first step is free, not a licence.** Nobody pays for a licence to try a sport they
have never done. If PKBA does not currently run séances découverte, adding one is the
highest-leverage change available and costs the club nothing.

**Two paths.** Primary: come to the Bassin. Secondary, one line below — *"Pas dans le
coin ?"* — a curated list of French parkour clubs. One static page serving the ~9,900
followers who will never reach La Teste. A brand calling itself the door into parkour is
more credible when it helps people start anywhere, and this quietly builds the 2027
national play for free.

## The collection and the rentrée burst

**Three pieces.** Tee, hoodie, one accessory. Enough to read as a drop, small enough to
finish alongside a site migration. The existing nine stay live as *l'essentiel* but stop
being the front page.

**Photography is largely already covered and does not block the build.** The 76 Printful
mockups in `public/images/product/` carry the product pages, and Printful generates more on
demand. Rule 5 explicitly permits AI renders for product and campaign work, so the drop
itself can launch on renders — the pipeline is already proven by the Bangkok carousel. The
existing two-year Instagram archive covers general site photography.

**One narrow exception: `/commencer`.** That page must make a nervous stranger believe
people like them are there, which rules 2 and 4 encode. A brand archive is built from the
best takes of the best athletes; nobody posts a beginner's third attempt. That imagery has
to be captured deliberately because it is the one category nobody shoots.

Scope: a phone at one regular PKBA session in September, roughly twenty minutes, people who
started that month. This sits outside August entirely and does not gate the migration.

**The burst** — roughly ten posts across three weeks, all shot on that one day, all
scheduled in advance:

- late August: two teasers, the door message
- first weekend of September: forum des associations, real first-timers
- the collection drop
- mid-September: the first découverte sessions, misses included

**Immediate, this week, zero cost:** the finished carousel sitting untracked in
`creative/instagram/2026-07-summer-comeback/` gets posted. Under rule 5 it is a product
render, not a claimed session, so it is clean. It warms a cold account six weeks before
rentrée.

## The story

Full version at `/a-propos`, condensed to one scroll section on the homepage. Not on
`/commencer`.

**Evidence, not prose.** A dated timeline where every beat carries a real artefact —
photos, the France 3 clip, the association registration.

| | |
|---|---|
| 8 ans | FFG, niveau national |
| nov 2024 | VertiFlow |
| juil 2025 | PKBA fondée — association loi 1901 |
| — | reportage France 3 Nouvelle-Aquitaine |
| aujourd'hui | 80+ licenciés |

**The injury and the comeback are included on the site**, not only in the September
content. It is the beat a nervous beginner identifies with most, and fear of injury is the
single most common reason people never try parkour.

**Governance constraint.** VertiFlow is a micro-entreprise; PKBA is an association loi 1901
with three 2027 CERFA subsidy dossiers open at COBAS, Gujan-Mestras and La Teste, and
Maxime is its treasurer. Public copy must hold the framing: **same founder, same community,
two separate entities.** The story may say he built both. It must not read as though they
are one, because subsidised association funds must not appear to benefit a private
commercial business.

## Le journal

The second acquisition channel, and for the December test it likely converts better than
Instagram — search intent beats scroll, and an article written once still works in March.

**Cornerstone articles, door-facing:**

- *Commencer le parkour sur le Bassin d'Arcachon* — the money page, points at `/commencer`
- *Parkour débutant : par où commencer* — the fear questions, answered honestly
- *Les spots du Bassin* — real local knowledge, uncopyable
- *Le parkour à Bordeaux* — the wider catchment

**Commercial articles.** French parkour merch keywords are low volume and almost entirely
uncontested, so a handful of articles can own the category outright. Little traffic in
2026; real groundwork for 2027.

- *Quelles chaussures pour le parkour ?* — **written first.** Highest-volume keyword in
  French parkour gear, and VertiFlow sells no shoes. An honest guide to a product with no
  commercial stake is the most credible page the site can publish, it ranks, and it lands
  the reader where the door and the shop both are.
- *Quels vêtements pour faire du parkour ?*
- *Ton premier kit parkour*
- *Comment choisir un t-shirt de parkour*

Then event recaps as they happen, continuing the existing `la-teste-de-buch-2025` and
`metz-2025` pattern.

**These eight articles are a queue, not an October batch.** Eight articles do not fit in a
month that also contains the weekly content loop, at 1h/week. Order: *Quelles chaussures*
and *Commencer le parkour sur le Bassin* in October — the highest-intent commercial keyword
and the highest-intent local one. The remaining six run one per fortnight through Q4 and
Q1. The journal compounds; it does not need to arrive all at once, and pretending otherwise
is how the whole plan slips.

**Agent boundary.** The agent handles structure, outlines, meta descriptions, internal
linking, and turning voice notes into clean prose. It does not supply local spot knowledge
and will fabricate it if asked — that is precisely the part that makes these articles rank
and worth reading. Draft from notes, never from nothing.

## Content engine (October)

**Principle: automate the expensive part, not the cheap part.**

The expensive part is drafting — captions, hooks, hashtags, monthly calendar, holding voice
steady in November. The cheap part is clicking schedule.

**The Instagram Graph API is deliberately not used.** It saves roughly ten minutes a month
and buys a permanent maintenance surface: Business account, Facebook page, developer app,
app review, and long-lived tokens expiring every ~60 days. Token expiry is a silent failure,
and at 1h/week a silent failure means discovering in December that nothing posted since
October — during the month the count matters. The Graph API path in `automation/SETUP.md`
stays shelved until the account justifies the maintenance.

**Instead: agent drafts → human approves → Meta Business Suite schedules.** Native, free,
~75 days ahead, no tokens to babysit.

**Weekly loop, ~1h:**

1. Scheduled agent reads `content/queue/`, drafts the week's captions against `BRAND.md`,
   flags anything breaking an art-direction rule
2. Maxime reviews the batch — accept, edit, veto
3. Bulk-schedule in Business Suite
4. Monthly, the agent proposes the next month from what performed

## Schedule

| When | What |
|---|---|
| now → early Aug | klyx-estate has the daytime. VertiFlow: post the carousel, land-or-drop `codex/commerce-main-release`, rebase onto `origin/main`, write `BRAND.md` and `brand.tokens.json` |
| Aug | migration on branch · live payments path as its own reviewed workstream · artwork for 3 pieces |
| late Aug | **`/commencer` ships on the current static site** · rentrée burst drafted and scheduled |
| early Sept | rentrée campaign runs on the old site · forum des associations · découverte counting starts |
| Sept | 20-min beginner capture · Printful products created · reviewed catalogue invariant updated |
| when ready | **single launch** — new site + collection + live shop, cutover to `main` |
| Oct–Nov | content engine, journal articles |
| 31 Dec | count |

## Designing for parallel work

klyx-estate runs alongside this throughout. Three structural requirements follow, and they
are binding on the implementation plan:

1. **Every chunk ships in one sitting.** No task requires a long uninterrupted block. Three
   hours on a Tuesday produces something merged, never something half-migrated.
2. **The branch preview stays deployable at all times.** State is visible in a browser, not
   reconstructed from memory.
3. **Strict ordering.** "If I only get one session this week" always has an obvious answer.
   The only date-locked items are the rentrée window and the 31 December count; everything
   else is a queue pulled in order.

## Risks

1. **Nobody at PKBA owns the découverte list.** The success test cannot be measured without
   a named person greeting arrivals and ticking the box. Unowned, it defaults to Maxime and
   creates exactly the weekly club obligation `vision-2026` capped. Settle before September.
2. **August's hours.** August belongs to klyx-estate by the 2026-07-14 decision; this plan
   wants ~4h/week. If it takes more, it takes it from there. That should be a decision, not
   a discovery in September.
3. **Gold-plating the refonte.** Biggest item and the most enjoyable one. `/commencer`
   converting matters more than any homepage animation.
4. **`/commencer` ships with elite imagery.** If the twenty-minute September capture does
   not happen, the page falls back to archive photography of good athletes doing clean
   lines — which actively argues against the message the page exists to deliver.
5. **The single launch pulls the payments path forward.** One unified launch means the
   riskiest workstream sets the date. The failure mode is compressing a live payments review
   to hit a self-imposed deadline. The date moves; the review does not shorten. `main` keeps
   serving the current site for as long as that takes, and `/commencer` on the old site
   means the December test is never waiting on it.

## Out of scope

Brand book · general-purpose CMS · TikTok, YouTube, Shorts · manufactured or inventoried
product · Instagram Graph API · database · user accounts · national expansion · rebuilding
the existing legal pages beyond porting them.

## Open questions

1. Does PKBA currently run free séances découverte? If not, one must be added — the funnel
   depends on a zero-commitment first step.
2. Who at PKBA owns the découverte list from September? Named person required before
   cutover.
3. What is the exact date of the forum des associations in La Teste and Gujan-Mestras? The
   burst schedule anchors to it.
4. Which three pieces make up the collection, and what is the collection's name?
5. Which French parkour club list is authoritative for the *"pas dans le coin"* page?
