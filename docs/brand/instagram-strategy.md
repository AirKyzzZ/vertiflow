# VertiFlow — Instagram strategy

An executable plan for one account, roughly 10k followers, silent for months, run by one
person with a full-time job. Everything below assumes `BRAND.md` and
`creative/house-look.md` as fixed constraints, not suggestions.

## Resolve this first: the Bangkok carousel is disqualified

`docs/superpowers/specs/2026-07-27-vertiflow-brand-refresh-design.md` (last touched
2026-08-08) instructs that the finished carousel in
`creative/instagram/2026-07-summer-comeback/` gets posted immediately, "zero cost," on the
reasoning that it's a product render under art-direction rule 5 and therefore clean.

`creative/house-look.md`, committed 2026-08-10 and refined again 2026-08-13, postdates that
instruction and tightens exactly the rule it leans on. It draws a line the July spec didn't
have yet: generated imagery of Maxime can be *campaign* work, but must never be
*documentary* — must never imply a real session, real training partners, or a real crowd.
It calls fabricated session imagery "the one failure this brand cannot recover from,"
because the entire success test is strangers physically showing up.

Read the Bangkok prompt (`creative/instagram/2026-07-summer-comeback/prompt.md`) against
that rule and it fails on multiple counts, not one:

- It explicitly asks for **"real commuters in soft distant motion blur"** — a fabricated
  crowd of bystanders at what's presented as a real location.
- It insists the image **"must feel like a real high-end streetwear campaign shot on
  location, never like CGI or an AI render"** — engineered specifically to be mistaken for
  documentary photography, which is the opposite of what the house look now requires.
  AI-generated imagery is supposed to read as a considered campaign frame, not as evidence.
  This is a stronger and more disqualifying failure than the missing crowd alone.
- It's set in **Bangkok**, which has zero connection to VertiFlow and fails art-direction
  rule 1 outright — no real named spot, no Bassin d'Arcachon, no France.
  It's the most generic-urban imagery imaginable, the exact thing rule 1 exists to prevent.
- **Cyan and magenta reflections together** violate the house palette (one restrained cool
  counter-colour only, never two, never saturated) and drift toward the cyberpunk/neon
  grading the house look explicitly bans.

**Verdict: do not post any of the three Bangkok slides, and treat the 2026-07-27 spec's
instruction to post them as superseded.** This isn't a close call — the newer, more
specific document exists precisely to correct the older one, and it names the failure mode
these images embody almost point for point. Nothing in this strategy depends on them.
Archive the folder as a documented lesson in the "campaign, not documentary" distinction
rather than as usable inventory.

One operational note found while building this plan, unrelated to Bangkok but relevant to
every post below that references it: **`/commencer` doesn't exist yet.** It's linked from
the header, footer and homepage CTA, but there's no route in `src/app`, no legacy static
page, and no redirect — it will 404 today, and it's explicitly scoped to land *after* the
Monday 25 August storefront launch, not before. Every post in the arc below that would
naturally point at `/commencer` needs either that page live first, or a bio link pointed
somewhere that currently resolves (the homepage, or PKBA's own site,
`pkba.vertiflow.fr`) until it ships. Flagging this here so it doesn't quietly break the
funnel the whole plan is built around.

## The relaunch arc: the first 3 posts, in order

The ordering logic is: **rebuild trust, then prove the shop is real, then ask for the
harder thing.** A dormant account that opens by selling reads as "you only came back for my
wallet." A dormant account that opens with the door reads as unearned, because nobody's
re-established why they should listen yet. Reconnection has to come first, commerce second,
the actual ask — come train — third, once credibility is back on the table.

### Post 1 — "J'ai arrêté de poster" (reconnection)

**Status: already built, ready to publish now.** The caption and card exist at
`creative/instagram/2026-08-comeback/` (`comeback-card.png`, 1080×1350). See
`docs/brand/launch-captions.md` for the reproduced text.

**What it does:** re-opens the channel without asking for anything. Names the silence
directly instead of pretending it didn't happen — an account that vanishes and comes back
acting normal reads as evasive; one that says "I stopped posting" out loud reads as honest.
It plants one credibility marker (80 licenciés, the club kept running without him) and
makes exactly one forward-looking claim, and that claim is deliberately unfalsifiable:
things are coming, shown when they're ready.

**Why first:** it costs nothing to publish (already made), it makes no claim that Monday's
launch could invalidate, and it needs zero storefront readiness. Publishing it now, ahead
of the storefront going live, also gives the algorithm two or three days to start
re-surfacing the account to dormant followers before a second, sales-adjacent post
competes for that same reach.

### Post 2 — the shop is real again (tied to the Monday launch)

**What it does:** confirms the store works, anchored on one flagship piece (the CLIMB tee —
already the site's lead product) rather than a grid of nine. Honest about the mechanics:
print-on-demand, made when ordered, 5–10 working days rather than next-day, said before the
customer discovers it at checkout rather than after. This is the second beat of trust
repair, not a sales push — the copy should read as "here's proof this is real and I'm not
hiding the slow part," not "buy now."

**Why second, and a real dependency:** this only fires once the Monday storefront launch
actually lands. Per `.superpowers/sdd/2026-08-22-vertiflow-storefront-monday/progress.md`,
as of this writing the checkout and legal pages are built and passing tests, but the live
Stripe rehearsal and go-live step are still pending. **Hold this post until that rehearsal
is confirmed done** — publishing "the shop is open" copy against a store that still 500s or
takes only test-mode payments would cost more trust than Post 1 just rebuilt. If Monday
slips, don't force this post to a date; let Post 1 run alone a little longer.

**Asset note:** no AI campaign portrait of Maxime wearing the CLIMB tee exists yet (see the
asset checklist below — the reference-photo folder is empty), so this post should not
depend on one. Use the word-card format (zero new asset) or a flat product image pulled
from the live `/boutique` product page itself, which already renders the correct current
logo from Printful's CDN. Do not use the 76 legacy PNGs in `public/images/product/` — per
`asset-decisions.md` they carry the old circular monogram, not the current wordmark, and
shipping them on Instagram would re-brand the account backwards on the same day the site
corrects it.

### Post 3 — the door (credibility → "can I do it")

**What it does:** answers the actual fear, using real credentials to make the invitation
trustworthy: eight years of competition, a club built from nothing to 80+ licenciés, a real
fitted-out space in Gujan-Mestras. Not bragging — the point of stating it is "the person
opening this door has actually done the thing," which is what makes "yes, you can do it
too" credible instead of generic. Ends on the six-question promise from `BRAND.md`
compressed into one line, and a call to the bio link.

**Why third:** this is the actual ask, and it should only land once the previous two posts
have re-established that the account is trustworthy and the shop behind it is real. It's
also the post most naturally timed to the *"forum des associations, real first-timers"*
beat already planned for the first weekend of September in the 2026-07-27 spec — if that
lines up, this post can run then; if not, it doesn't need to wait for a specific date, only
for Posts 1 and 2 to have landed.

**Two dependencies to check before publishing:**
1. **`/commencer` must resolve**, or the bio link must point somewhere that currently does
   (see the flag above). This post's entire job is to send people through that door — don't
   publish it against a 404.
2. The caption below is written to work as a word-card (Format 1, zero new photography). If
   the September PKBA shoot described in the spec (real beginners, real misses, ~20 minutes
   at one session) happens in time, this post is stronger with that photography instead —
   treat the word-card version as the reliable fallback, not the ceiling.

## Five repeatable content formats

Each is designed to be shot or produced inside a real week, not a production day.

### 1. Carte-mot (word card)

**Purpose:** carries voice-first posts — announcements, reassurance, myth-busting, direct
address — with zero photography. This is the format that makes a 1-hour week possible.

**Recipe:** reuse the existing pipeline at `creative/instagram/2026-08-comeback/card.html`
as a template — Archivo Expanded variable font at `font-variation-settings: "wdth" 125`,
ink background, sodium-amber accent, rendered via headless Chrome at 2× and downscaled to
1080×1350 (`sips -Z 1350`). Swap the text, keep everything else. Fifteen minutes once the
template is set up.

**Example caption (French):**
> On me demande souvent l'âge minimum pour commencer. Il n'y en a pas vraiment — le club
> prend des gens à partir de 3 ans avec accord parental, et des gens qui commencent à 35
> ans passés. La seule vraie question, c'est pas ton âge. C'est si tu es prêt à rater
> devant d'autres gens la première fois. Si oui, le reste suit.

### 2. Rendu de collection (AI campaign portrait)

**Purpose:** hero moments for a drop or a flagship piece, when a real photoshoot isn't
practical. Governed entirely by `creative/house-look.md` — sodium-vapour night, Maxime
alone, campaign not documentary, garment fidelity preserved exactly.

**Recipe:** the pipeline already exists and is proven (`creative/site/home-hero/prompt.md`,
`creative/site/collection-hero/prompt.md`) — Higgsfield `z_image`, ~60-word prompt, house
palette and camera lines only, batch three framings per generation. **Currently blocked**:
`creative/references/maxime/` is empty. Nothing in this format can be produced until 8–15
character-lock reference photos are shot, per the spec already sitting in that folder's
`README.md`. This is the single highest-leverage thirty minutes Maxime could spend on this
whole content plan — it unblocks this format for Instagram and the still-outstanding
`home-hero` and `collection-hero` site slots at the same time.

**Example caption (French):**
> Le hoodie VF Definition, porté comme il est pensé pour l'être : avant que le jour se
> lève, avant que le Bassin se réveille. 64,99 €, lien en bio.

### 3. Vrai terrain (the miss and the make)

**Purpose:** the format `BRAND.md` rule 4 is actually about — "show the miss, not only the
make." Real phone photography or short clips from an actual PKBA session: beginners,
ordinary bodies, golden hour or sodium night, a fail shown next to a success. This is the
content category that does the most door-opening work in the whole plan, and it's the one
category nothing in the repo currently covers.

**Recipe:** matches the scope already agreed in the 2026-07-27 spec — roughly twenty
minutes at one regular PKBA session, phone camera, people who started that month, explicit
priority on capturing an attempt that doesn't land alongside one that does. This sits
outside any single week's 1-hour budget; treat it as a quarterly event, not a weekly task.

**Example caption (French):**
> Troisième essai. Les deux premiers, elle a posé les mains trop tard. Le troisième, non.
> Elle a commencé le mois dernier. C'est à ça que ressemble "débuter" — pas à la vidéo
> parfaite que tu as vue hier soir.

### 4. Le geste du produit (product tied to a use-case)

**Purpose:** lets a product post exist without turning the feed into a catalogue. Every
post in this format opens on what the piece lets you *do*, not on what it costs — matching
the register already established in `src/lib/product-copy.ts` (*"Tu sautes, tu réceptionnes,
il suit"*), which is written, approved, and currently unused outside the product pages.

**Recipe:** one product, one moment, one honest detail (fabric behaviour, fit, a real use
case), price and bio link last. Photography can be as simple as the existing
`public/images/product/back_tshirt.webp` (the actual CLIMB back graphic, which the Printful
CDN cover shot doesn't show) or a flat-lay shot on a real surface — doesn't need the full
campaign-render pipeline.

**Example caption (French):**
> Le short performance, pensé pour une seule chose : que tu l'oublies pendant la séance.
> Taille élastique, tissu léger, il suit la réception sans remonter. 47,99 €, lien en bio.

### 5. Le repère (real spot check-in)

**Purpose:** answers the "where" question from `/commencer` in the cheapest possible way,
and gives followers outside the Bassin a sense of real geography instead of "somewhere
urban." Doubles as low-effort, high-authenticity filler between bigger posts.

**Recipe:** whenever Maxime is already at a real spot — La Teste-de-Buch, Gujan-Mestras,
Bordeaux — one phone photo, thirty seconds, no production. Not AI-generated; the whole
point is that it's a real place a follower could actually go stand in.

**Example caption (French):**
> Ce muret, à Gujan. Rien de spécial à le regarder. Tout, une fois que tu sais ce qu'on en
> fait. Le local du club est à cinq minutes à pied.

## Weekly cadence — sized for a full-time job, not a content calendar

The design spec already fixed the real time budget: roughly 4h/week through the end of
August, dropping to a **1h/week sustained baseline from September**, with discretionary
bursts around real events (forum des associations, the collection drop, the September
découverte sessions). Build the cadence around that number, not around a generic
"post daily" plan that Maxime cannot sustain past week three.

**Baseline (1h/week, most weeks):**
- 1 feed post — Format 1 (word card) or Format 4 (product), whichever has something real to
  say that week. Both fit inside the hour, including production.
- 2–3 Stories — cheaper than a feed post, and disproportionately important for the
  reactivation problem below.
- No obligation to post on a fixed day. A real thing to say beats a slot on a calendar.

**Bursts (event-driven, a few times a year, not weekly):**
- Format 2 (AI campaign portrait) and Format 3 (real session photography) are both too
  expensive for a 1-hour week — batch them around actual events (a collection drop, the
  September PKBA session, the forum des associations) exactly as the existing spec's
  "ten posts across three weeks, shot in one day" plan already does.
- Treat a burst as buying down several future weeks of baseline content at once, not as an
  addition on top of the weekly hour.

**What this deliberately does not include:** a fixed daily posting requirement, Reels
trend-chasing, or any format that assumes a second person behind the camera. All five
formats above are things one person can produce solo.

## The 10k dormant followers: reactivation, not growth

Reactivation and growth are different problems with different mechanics, and treating them
as the same thing is the most common way a comeback post underperforms.

**Growth** is a discovery problem — new people finding the account, which depends on reach
into non-followers, hooks, and volume. **Reactivation** is a re-permission problem — people
who already opted in once, whose attention has to be re-earned, and whose relationship with
the account Instagram's own ranking has almost certainly down-weighted after months of
silence. The 10k are not a cold audience to be won; they're a warm one that's gone quiet,
and the fix looks different:

- **Fix the profile before Post 1 goes out, not after.** Anyone reactivated by Post 1 will
  tap through to the profile within seconds. A bio, highlights, or pinned content that still
  looks abandoned undoes the post's work immediately. This costs nothing and is easy to
  skip under a deadline — don't skip it.
- **Lean on Stories in the first two weeks**, not just feed posts. Stories surface near the
  top of a follower's bar largely by relationship rather than by the same ranking signals
  that suppress a dormant account's feed reach — they're the fastest way to physically
  re-appear in front of people who already know the account, before feed reach recovers.
- **Don't sell in the first two posts.** Post 1 explicitly makes no shop claim, and Post 2
  should read as "proof this is real," not "buy now" — see the arc above. To a dormant
  audience, an immediate pitch reads as "you only came back for my wallet," which damages
  exactly the trust the relaunch is trying to rebuild.
- **Close old loops if any exist** — unanswered DMs or comments from before the silence.
  Replying now, even months late, is a stronger one-to-one trust signal than anything
  postable to the whole feed, and it costs nothing but the time to scroll back.
- **Comments matter more than likes for re-permission.** Post 1's caption already ends on a
  direct, answerable line — protect that in future posts. A caption inviting a reply gives
  the algorithm a stronger reactivation signal per dormant follower than a caption inviting
  a silent like.
- Follower count is explicitly not the metric this plan optimises for (see below) — a
  reactivated core of a few hundred genuinely re-engaged followers is worth more to the
  actual goal than passive reach to all 10k.

## How product posts earn their place

The risk with nine products and a founder who needs the shop to matter is a feed that
slowly turns into a catalogue with captions. Two concrete rules keep that from happening:

1. **No product post opens on price or the product name.** It opens on what the piece lets
   the wearer do, using the register already written in `product-copy.ts`. Price and the
   bio-link CTA go last, not first.
2. **Cap product-first posts at roughly one in four.** For every product post, at least
   three should be Format 1, 3, or 5 — voice, door, or place. If a week's queue is looking
   catalogue-heavy, the fix is to cut a product post, not to add a non-product one on top.

A product post that follows Format 4 above and opens with a real use-case sentence reads as
brand content that happens to be purchasable. A product post that opens with "Nouveau : le
hoodie VF Definition, 64,99€" reads as an ad. Both are technically "a product post" — only
one belongs in this feed.

## Metrics that actually matter — and the ones to ignore

The account already has a fixed, dated success test, defined in the 2026-07-27 design spec
and worth restating here because it should be what this whole plan is judged against:
**15 first-time attendees at a PKBA session by 31 December 2026 who say they came via
VertiFlow or its Instagram**, measured on one field on PKBA's own inscription form —
*"Comment tu nous as connus ?"* That number, not anything Instagram itself reports, is the
actual scoreboard.

**Track these:**
- **Bio-link click-throughs, split by destination.** The bio link serves two different
  jobs — one leads to `/commencer` (the federation goal), one leads to `/boutique` (the
  revenue side-effect). If the link only ever points one place, use a second link-in-bio
  slot or distinguishable UTM-tagged links so it's visible which job each post is actually
  doing. Right now there's no way to tell, and that's worth fixing before volume makes it
  matter.
- **`/commencer` views and click-throughs to PKBA's inscription page** — the leading
  indicator named in the spec, and the one number that predicts the December test before
  December arrives.
- **Comment replies on Posts 1–3 specifically**, as the reactivation signal described
  above — not as vanity, but because a caption that gets replies is reaching people the
  algorithm still considers engaged, which is the exact population Post 3's door message
  needs to land with.
- **Saves on product posts** — for a store, a save is closer to real purchase intent than a
  like, and worth watching per-format to see whether Format 4 is actually working.

**Explicitly ignore, as primary signals:**
- **Follower count.** Not a success metric per the spec, and chasing it actively pulls
  content toward growth tactics (trend-chasing, generic hooks) that work against the
  reactivation and door goals above.
- **Reach and impressions in isolation.** A post can reach thousands of people who were
  never going to attend a PKBA session or buy a t-shirt; it's not evidence the plan is
  working.
- **Revenue.** Explicitly not the point per the spec's own framing — VertiFlow is a
  federation project wearing a storefront, not the other way around. Revenue is a healthy
  side-effect to notice, not a target to optimise the content plan toward.
- **Post volume / posting streaks.** A 1h/week baseline that occasionally skips a week
  because there's nothing real to say is healthier than a forced streak that starts
  generating filler — and filler is the fastest way back to silence.

## Assets that do not exist yet — the actual shoot list

Concrete, mapped to the formats above, so this reads as a checklist rather than a wish list.

| Needed | Blocks | Cost | Notes |
|---|---|---|---|
| 8–15 character-lock reference photos of Maxime | Format 2 entirely, plus the still-outstanding `home-hero` and `collection-hero` site slots | ~30 min, solo, phone on a tripod or a friend with a camera | Spec already written in `creative/references/maxime/README.md` — straight-on, three-quarter, profile, full body, 2–3 in VertiFlow garments, neutral light. This is the single highest-leverage gap in the whole plan. |
| ~20 minutes of real photography at one PKBA session | Format 3, and directly the strongest door-opening content this brand can produce | One session, phone camera, no crew | Already scoped in the 2026-07-27 spec: beginners, people who started that month, deliberately including a miss. Cannot be simulated by Format 2 — this content only works because it's real. |
| On-body / texture detail shots of at least the top few products | Format 4, beyond what `back_tshirt.webp` and the two existing detail crops (`short_confort_detail.png`, `bob_detail.png`) already cover | Minutes per product, whenever Maxime is wearing one | The 76 legacy PNGs in `public/images/product/` cannot substitute — old logo, flagged as unusable in `asset-decisions.md`. |
| Nothing — Format 1 and Format 5 are ready today | — | — | The word-card pipeline is built and already used once, for the comeback card (`card.html` / `card-flat.html` is the same card, a lighter-glow variant, not a second post); spot check-ins need only a phone and a real location Maxime is already visiting. Lean on these two for the 1h/week baseline while the above gaps close. |

One asset worth a deliberate decision rather than default use: `public/images/about.jpeg`
(athlete mid-tuck over a vault box) is the only real photograph in the repo with genuine
editorial quality, but `asset-decisions.md` flags it for a consent check before commercial
use — confirm who's in it and that commercial use is fine before it appears on Instagram.
