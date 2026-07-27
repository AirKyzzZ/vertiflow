# VertiFlow Foundation & The Door — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconcile the repository onto `origin/main`, establish a verified test baseline, write the brand system of record, and ship a `/commencer` door page on the current static site so the December success test starts counting during the rentrée.

**Architecture:** This plan touches the existing vanilla HTML/Bootstrap site only. It deliberately does **not** start the Next.js migration, which is plan 2, and does **not** touch the payments fence, which is plan 3. The door page reuses the Formspree endpoint already wired into `public/contact.html`, so no new service, credential or backend is introduced. Tests follow the repository's established pattern in `tests/environment.test.js`: file-content assertions run under `node --test`.

**Tech Stack:** Node ≥20 (`node --test`), vanilla HTML + Bootstrap 5, Formspree, git.

**Spec:** `docs/superpowers/specs/2026-07-27-vertiflow-brand-refresh-design.md`

## Global Constraints

- Node engine is pinned `>=20` in `package.json`; Netlify pins `NODE_VERSION = "22"`. Do not change either — `tests/environment.test.js` asserts both.
- The full suite is `npm test` (`node --test tests/*.test.js`). It must pass at the end of every task. There are 12 existing test files; none may be deleted or weakened in this plan.
- Never commit, log or bundle `VERTIFLOW_TEST_ACCESS_TOKEN`, Stripe keys, Printful credentials or EmailJS private credentials. `tests/environment.test.js` enforces this and `.env.example` values must stay empty.
- Do not touch `data/products.json`, `functions/`, `scripts/`, or `netlify.toml`. The payments fence described in `docs/commerce-catalogue.md` stays exactly as it is.
- All site copy is French, tutoiement, short sentences. Never assume the reader can already do anything.
- Commit messages: conventional commits, subject line only, no body, lowercase after the colon.
- **Never `git push`.** Every task ends at a local commit.
- Two steps in Task 1 and Task 2 are destructive or irreversible and are marked **STOP — human approval required**. Do not proceed past them autonomously.

## File Structure

| File | Responsibility |
|---|---|
| `BRAND.md` (create, repo root) | Human-facing brand system of record: positioning, tone, art-direction rules, the six questions. Read by humans and by the future content agent. |
| `brand.tokens.json` (create, repo root) | Machine-readable design tokens: colour, type. Consumed by the Tailwind config in plan 2. Nothing in this plan reads it at runtime. |
| `public/commencer.html` (create) | The door page. Six answers, one form. Ships on the current static site. |
| `tests/door.test.js` (create) | Asserts the door page exists, carries the attribution field that makes December countable, and leaks no credentials. |
| `public/index.html` (modify) | One navigation link to the door page. |

Nothing else is created or modified.

---

### Task 1: Reconcile the repository and verify the test baseline

The working branch descends from a pre-pipeline `main` and contains none of the commerce implementation. Everything downstream depends on fixing that first.

**Files:**
- Modify: none (git state only)

**Interfaces:**
- Consumes: nothing
- Produces: a working tree at `origin/main` + the six spec commits, with `npm test` passing. Every later task assumes this.

- [ ] **Step 1: Record the current state before changing anything**

```bash
git status
git log --oneline origin/main..HEAD
git worktree list
```

Expected: six `docs:` commits ahead of `origin/main`, two worktrees under `.worktrees/`, one prunable worktree at `/private/tmp/vertiflow-origin-main-9c04013`.

- [ ] **Step 2: Fetch and fast-forward local `main`**

```bash
git fetch origin
git branch -f main origin/main
git log --oneline -3 main
```

Expected: `main` now shows `fix: complete VertiFlow test checkout integration` at its tip. This only moves a branch pointer that had no local commits — verify with `git log --oneline origin/main..main`, which must print nothing.

- [ ] **Step 3: STOP — human approval required before rebasing**

Rebasing rewrites commits on the working branch. Confirm with Maxime before running Step 4. If he prefers a merge, use `git merge origin/main` instead and skip to Step 5.

- [ ] **Step 4: Rebase the working branch onto `origin/main`**

```bash
git checkout feature/brand-refresh-2026
git rebase origin/main
```

Expected: six `docs:` commits replay cleanly. They only add files under `docs/superpowers/specs/`, so conflicts are unlikely. If a conflict appears, stop and report it rather than resolving it — it means the branch contains something unexpected.

- [ ] **Step 5: Install dependencies and run the full suite**

```bash
npm install
npm test
```

Expected: PASS. All 12 test files green. This is the baseline the whole refresh is measured against — if it is red here, stop and report before doing anything else.

- [ ] **Step 6: Prune the stale worktree**

```bash
git worktree prune
git worktree list
```

Expected: `/private/tmp/vertiflow-origin-main-9c04013` disappears. The two `.worktrees/` entries remain — they are handled in Task 2.

- [ ] **Step 7: Commit**

Nothing to commit. Confirm the tree is clean apart from pre-existing untracked files:

```bash
git status --short
```

Expected: only `.DS_Store`, `automation/`, `creative/` and similar pre-existing untracked entries.

---

### Task 2: Resolve the unmerged commerce work

Seven commits sit on `codex/commerce-main-release` ahead of `origin/main`: a shared EmailJS template, Stripe Elements UI mode, and additional tests. Leaving them unresolved means the plan-2 migration would port from an ambiguous source.

**Files:**
- Modify: none directly (branch resolution only)

**Interfaces:**
- Consumes: the reconciled state from Task 1
- Produces: a single unambiguous source of truth for what plan 2 ports.

- [ ] **Step 1: Review what the seven commits actually change**

```bash
git log --oneline origin/main..codex/commerce-main-release
git diff --stat origin/main...codex/commerce-main-release
git diff origin/main...codex/commerce-main-release -- functions/ tests/
```

Expected: changes to `functions/lib/emailjs.js`, `functions/create-checkout-session.js`, `tests/emailjs.test.js`, `tests/create-checkout-session.test.js`, plus three docs files.

- [ ] **Step 2: Verify the branch's own suite passes**

```bash
git -C .worktrees/commerce-main-release status --short
cd .worktrees/commerce-main-release && npm test; cd -
```

Expected: PASS. If it fails, that is the answer — report it and stop; the work is not landable as-is.

- [ ] **Step 3: STOP — human approval required**

Present Maxime with: the seven commit subjects, the diffstat, and whether the suite passed. He decides land or drop. Do not merge, rebase or delete any branch without his explicit answer. This plan does not assume either outcome.

- [ ] **Step 4: Record the decision**

Append the outcome to the spec's open questions so plan 2 has an unambiguous starting point.

In `docs/superpowers/specs/2026-07-27-vertiflow-brand-refresh-design.md`, under `## Open questions`, add:

```markdown
6. `codex/commerce-main-release` (7 commits — shared EmailJS template, Stripe Elements UI
   mode): RESOLVED <date> — <landed into main | dropped>. Plan 2 ports from
   <origin/main | origin/main + these commits>.
```

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-07-27-vertiflow-brand-refresh-design.md
git commit -m "docs: record commerce branch resolution"
```

---

### Task 3: Write the brand system of record

Two files, split by what each format can actually express. `BRAND.md` is prose the content agent reads; `brand.tokens.json` is values the Tailwind config imports in plan 2. Markdown cannot configure Tailwind and JSON cannot express tone.

**Files:**
- Create: `brand.tokens.json`
- Create: `BRAND.md`

**Interfaces:**
- Consumes: nothing
- Produces: `brand.tokens.json` with top-level keys `color`, `font`, consumed by `tailwind.config.ts` in plan 2. `BRAND.md` is prose, consumed by humans and the content agent in plan 4.

- [ ] **Step 1: Create `brand.tokens.json`**

```json
{
  "color": {
    "base": "#0B0B0C",
    "paper": "#F7F4EF",
    "accent": "#E8912D",
    "neutral": {
      "900": "#1A1A1D",
      "700": "#3D3D42",
      "500": "#6E6E76",
      "300": "#B4B4BC",
      "100": "#E4E2DE"
    }
  },
  "font": {
    "display": "'Archivo Expanded', 'Archivo', system-ui, sans-serif",
    "body": "'Inter', system-ui, sans-serif"
  }
}
```

The accent is the sodium-amber from the existing campaign direction. The iridescent carabiner spectral is deliberately absent — it is a garment graphic only and must never enter UI contrast decisions.

- [ ] **Step 2: Create `BRAND.md`**

````markdown
# VertiFlow — brand system

Tokens live in `brand.tokens.json`. This file holds everything prose.

## Positioning

The door into parkour, with the credibility to keep you once you're serious.

One rule resolves both halves: **production value signals performance, subject matter
holds the door open.** Serious craft applied to beginners, daylight sessions, and people
missing jumps.

## Tone

French. Tutoiement. Short sentences. Never assume the reader can already do anything.

## Art direction

1. Real named spots — La Teste, Gujan, Bordeaux. Never generic urban.
2. Beginners and ordinary bodies in frame, not only clean elite lines.
3. Shot at the hours people train: golden hour, dusk, sodium night.
4. **Show the miss, not only the make.**
5. AI imagery for product and campaign renders only. Never for anything implying a real
   person at a real session.

## The six questions `/commencer` answers, in order

1. What is this?
2. Can *I* do it?
3. Where?
4. When?
5. What does it cost?
6. Will I be the worst one there?

## Entity boundary

VertiFlow is a micro-entreprise. PKBA is an association loi 1901. Same founder, same
community, **two separate entities**. Copy may say both were built by the same person. It
must never read as though they are one organisation.
````

- [ ] **Step 3: Verify the JSON parses**

```bash
node -e "const t=require('./brand.tokens.json'); console.log(Object.keys(t.color), t.font.display)"
```

Expected: `[ 'base', 'paper', 'accent', 'neutral' ] 'Archivo Expanded', 'Archivo', system-ui, sans-serif`

- [ ] **Step 4: Run the suite to confirm nothing regressed**

```bash
npm test
```

Expected: PASS. New root files do not affect any existing assertion.

- [ ] **Step 5: Commit**

```bash
git add BRAND.md brand.tokens.json
git commit -m "feat: add brand system of record"
```

---

### Task 4: Create the VertiFlow discovery base and ship the door page

`/commencer` on the current static site. This is what makes the December test countable during the rentrée, independently of when the new site launches.

**Files:**
- Create: `tests/door.test.js`
- Create: `public/commencer.html`
- Modify: `public/index.html`
- Modify: `public/politique-de-confidentialite.html`

**Interfaces:**
- Consumes: the tone and six questions from `BRAND.md` (Task 3)
- Produces: a live page at `/commencer.html` embedding a VertiFlow-owned Airtable form whose fields are `Prénom`, `Email`, `Âge`, `Source`. Plan 2 replaces the embed with a branded Next.js form posting to a Route Handler holding the Airtable token server-side; these four field names are fixed so the count stays continuous across that change.

- [ ] **Step 1: Create the VertiFlow discovery base in Airtable**

**This base belongs to VertiFlow, not PKBA.** Do not create it in a PKBA workspace, do not link it to any PKBA table, and do not copy PKBA member data into it. VertiFlow is a micro-entreprise; PKBA is an association loi 1901 with three open CERFA subsidy dossiers. Keeping their personal-data stores separate is the same boundary the spec's governance constraint describes.

Create a base named `VertiFlow — Découverte`, one table `Leads`, exactly these fields:

| Field | Type | On the form? |
|---|---|---|
| `Prénom` | Single line text | yes, required |
| `Email` | Email | yes, required |
| `Âge` | Single line text | yes, required |
| `Source` | Single select — `instagram`, `site`, `bouche-à-oreille`, `forum`, `autre` | yes, required |
| `Reçu le` | Created time | no — automatic |
| `Venu` | Checkbox | **no** — ticked after the session |
| `Séance` | Date | **no** — which session they attended |

`Source` is the attribution mechanism. `Venu` is the December count: the number is the row count where `Venu` is checked **and** `Source` is `instagram` or `site`.

Create a Form view on `Leads` exposing only the four form fields. Title it `Viens essayer`, set the submit button to `Je viens à une séance`, publish it, and copy the share link. Later steps call this the **discovery form URL**; its embed form is `https://airtable.com/embed/<id>`.

- [ ] **Step 2: Write the failing test**

Create `tests/door.test.js`:

```javascript
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');

function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

test('door page answers the six questions in order', () => {
  const door = readProjectFile('public/commencer.html');
  const headings = [
    "C'est quoi le parkour",
    'Est-ce que je peux le faire',
    'Où',
    'Quand',
    'Combien',
    'pire',
  ];
  let cursor = 0;
  for (const heading of headings) {
    const index = door.indexOf(heading, cursor);
    assert.notEqual(index, -1, `missing or out of order: ${heading}`);
    cursor = index;
  }
});

test('door page embeds the VertiFlow discovery form', () => {
  const door = readProjectFile('public/commencer.html');
  assert.match(door, /<iframe[^>]+src="https:\/\/airtable\.com\/embed\/[A-Za-z0-9]+"/);
  assert.match(door, /title="Formulaire séance découverte"/);
});

test('door page holds no credentials and no PKBA data surface', () => {
  const door = readProjectFile('public/commencer.html');
  assert.doesNotMatch(door, /(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]+|whsec_[A-Za-z0-9]+/);
  assert.doesNotMatch(door, /pat[A-Za-z0-9]{10,}|key[A-Za-z0-9]{14}/);
  assert.doesNotMatch(door, /airtable\.com\/(?:app|tbl)[A-Za-z0-9]+/);
});

test('privacy policy covers the discovery lead data', () => {
  const policy = readProjectFile('public/politique-de-confidentialite.html');
  assert.match(policy, /séance découverte/i);
  assert.match(policy, /Airtable/);
});

test('home page links to the door', () => {
  assert.match(readProjectFile('public/index.html'), /href="commencer\.html"/);
});
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
node --test tests/door.test.js
```

Expected: FAIL — `ENOENT: no such file or directory, open '.../public/commencer.html'`

- [ ] **Step 4: Create `public/commencer.html`**

Copy the `<head>`, navigation and footer markup verbatim from `public/contact.html` so the page inherits the existing Bootstrap chrome, then replace the page body with the block below. Keep the existing stylesheet and script tags exactly as they appear in `contact.html`.

```html
<section class="container py-5">
  <h1 class="display-5 mb-3">Viens essayer.</h1>
  <p class="lead">Première séance gratuite. Tu n'as besoin de rien savoir faire.</p>

  <h2 class="h4 mt-5">C'est quoi le parkour ?</h2>
  <p>Se déplacer, franchir, grimper. Tu apprends à bouger dans un endroit qui n'a pas été
    construit pour ça. Ça commence par marcher sur une barre sans tomber.</p>

  <h2 class="h4 mt-4">Est-ce que je peux le faire ?</h2>
  <p>Oui. Personne n'arrive en sachant. Le premier cours, tu vas rater des trucs, et c'est
    exactement ce qu'on attend. On a des gens qui ont commencé le mois dernier.</p>

  <h2 class="h4 mt-4">Où ?</h2>
  <p>Bassin d'Arcachon, avec le club PKBA. L'adresse exacte de la prochaine séance
    t'arrive par mail quand tu remplis le formulaire.</p>

  <h2 class="h4 mt-4">Quand ?</h2>
  <p>Toutes les semaines pendant l'année scolaire. Dis-nous quand tu es dispo, on te
    répond avec le prochain créneau.</p>

  <h2 class="h4 mt-4">Combien ça coûte ?</h2>
  <p>La première séance est gratuite. Si tu continues, tu prends une licence au club.
    Rien à payer pour venir voir.</p>

  <h2 class="h4 mt-4">Je vais être le pire, non ?</h2>
  <p>Probablement, pendant une heure. Tout le monde l'a été. Les gens qui sont bons
    aujourd'hui étaient nuls devant les mêmes barres il y a deux ans.</p>

  <h2 class="h4 mt-5">Réserve ta séance</h2>
  <iframe
    class="airtable-embed w-100 mt-3"
    src="THE_DISCOVERY_FORM_EMBED_URL_FROM_STEP_1"
    title="Formulaire séance découverte"
    frameborder="0"
    onmousewheel=""
    height="760"
    style="background: transparent; border: 1px solid #ccc;"></iframe>
</section>
```

Replace `THE_DISCOVERY_FORM_EMBED_URL_FROM_STEP_1` with the embed URL captured in Step 1 — it has the shape `https://airtable.com/embed/<id>`. Use the **embed** URL, not the base or table URL: a URL containing `app…` or `tbl…` exposes internal identifiers and the test in Step 2 rejects it.

The `Source` field inside that form is the entire measurement mechanism for the December test. Do not remove it from the form view and do not make it optional.

- [ ] **Step 5: Add the navigation link in `public/index.html`**

Find the existing primary navigation `<ul>` and add as the first item, so the door precedes the shop:

```html
<li class="nav-item"><a class="nav-link" href="commencer.html">Commencer</a></li>
```

- [ ] **Step 6: Add the discovery data to the privacy policy**

VertiFlow now collects names, emails and ages — including those of minors — for a commercial entity. `public/politique-de-confidentialite.html` must say so. Add this section, matching the surrounding markup:

```html
<h2>Séance découverte</h2>
<p>Quand tu remplis le formulaire de séance découverte, on collecte ton prénom, ton email,
  ton âge et la façon dont tu nous as connus. Ces données sont stockées chez Airtable, sur
  une base qui appartient à VertiFlow et qui est séparée de celle du club PKBA. On les
  utilise uniquement pour te recontacter au sujet d'une séance, et on ne les revend pas.
  Écris à vertiflow.pro@gmail.com pour les consulter ou les supprimer.</p>
```

- [ ] **Step 7: Run the test to verify it passes**

```bash
node --test tests/door.test.js
```

Expected: PASS, 5 tests.

- [ ] **Step 8: Run the full suite**

```bash
npm test
```

Expected: PASS. 13 test files now. `tests/environment.test.js` only inspects `public/checkout.html`, `public/js/custom.js` and `public/success.html`, so a new page does not affect it — if it does fail, stop and report rather than editing that file.

- [ ] **Step 9: Commit**

```bash
git add public/commencer.html public/index.html public/politique-de-confidentialite.html tests/door.test.js
git commit -m "feat: add commencer door page"
```

---

### Task 5: Verify the door end to end before it carries the rentrée

A page that renders but whose form silently fails would produce a December count of zero for the wrong reason.

**Files:**
- Modify: none

**Interfaces:**
- Consumes: the deployed door page from Task 4
- Produces: a verified submission path. Plan 4 counts these submissions.

- [ ] **Step 1: Serve the site locally and open the page**

```bash
npx serve public -l 4173
```

Open `http://localhost:4173/commencer.html`. Confirm the six headings render in order, the chrome matches the rest of the site, and the page is readable on a phone-width viewport.

- [ ] **Step 2: Submit the form once with real values**

Fill in the embedded form and submit, selecting `instagram` as the source. Confirm the embed renders and scrolls correctly inside the iframe at phone width — a form the user cannot reach is the same as no form.

- [ ] **Step 3: Confirm the row landed with attribution intact**

Open the `Leads` table in the `VertiFlow — Découverte` base. Expected: one new row with `Prénom`, `Email`, `Âge`, `Source = instagram`, and `Reçu le` populated automatically. `Venu` and `Séance` must be empty — they are filled after a session, never by the form.

If `Source` is missing or free-text rather than a single select, the December count cannot be filtered — stop and fix the form view before shipping.

- [ ] **Step 4: Create the December count view**

In the `Leads` table, add a grid view named `Compte décembre` filtered to `Venu` is checked **and** `Source` is any of `instagram`, `site`. Its row count is the success test. Building it now means December is a glance rather than a data exercise.

- [ ] **Step 5: STOP — confirm the PKBA owner and the handoff**

The spec's top risk: someone must greet arrivals and tick `Venu`. Because the base is VertiFlow's and the session is PKBA's, there is a handoff — VertiFlow holds the lead, PKBA runs the session, and someone reports back who turned up. That reporting is a message, not a data-sharing arrangement, and no PKBA member data moves into this base.

Confirm with Maxime who that person is, by name, before the page goes live. If nobody owns it, the count defaults to him and this plan has created the weekly obligation `vision-2026` told him to cap.

- [ ] **Step 6: Report readiness**

Report to Maxime: the page URL, that a test submission arrived with `source` intact, and the named PKBA owner. Merging to `main` and deploying is his call, not this plan's — and this plan never pushes.

---

## Self-Review

**Spec coverage.** This plan implements: the reconciliation and branch-resolution prerequisites; the identity system of record (`BRAND.md`, `brand.tokens.json`); `/commencer` and its six questions; the attribution mechanism behind the December test; and the interim-door mitigation that decouples the count from the launch date. It deliberately excludes the Next.js migration (plan 2), the live payments path (plan 3), the collection and Printful products (plan 4), and the content engine and journal (plan 5).

**Deviation from the spec, deliberate:** the spec routes the découverte form to *PKBA's* Airtable. This plan creates a **separate VertiFlow-owned base** instead. Two reasons, both binding: the spec's own governance constraint requires the micro-entreprise and the association loi 1901 to stay distinct, and commingling a commercial entity's lead capture with an association's licence records is exactly what a CERFA subsidy review would question. The cost is a handoff — PKBA runs the session, someone reports back who attended — which Task 5 Step 5 makes an explicit named responsibility rather than an assumption.

**Why an embedded form rather than a posted one:** a static HTML page cannot hold an Airtable token safely. Airtable's own form view needs no token, no serverless function, and no change to `functions/` — which this plan is forbidden from touching. Plan 2 replaces the embed with a branded form posting to a Route Handler that holds the token server-side; the four field names are fixed so the count is continuous across that change.

**Placeholders:** one intentional substitution — the discovery form embed URL is produced by Task 4 Step 1 and consumed in Step 4. It is an output of an earlier step, not an unresolved decision, and Step 2's test rejects the wrong URL shape.

**Type consistency:** `brand.tokens.json` exposes `color` and `font` as top-level keys, and plan 2's Tailwind config must import exactly those. The Airtable fields `Prénom`, `Email`, `Âge`, `Source`, `Venu`, `Séance` are named identically in Task 4 Step 1, Task 5 Steps 3–4, and the plan-2 interface note. `Venu` + `Source` define the December count and no other filter should be used.

**Open risk carried forward:** Task 5 Step 4 is a human gate, not a code change. If the PKBA owner is not named, this plan ships a page that generates obligations nobody has agreed to absorb.
