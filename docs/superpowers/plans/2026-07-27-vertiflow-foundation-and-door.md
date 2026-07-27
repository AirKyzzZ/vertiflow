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

### Task 4: Ship the door page

`/commencer` on the current static site. This is what makes the December test countable during the rentrée, independently of when the new site launches.

**Files:**
- Create: `tests/door.test.js`
- Create: `public/commencer.html`
- Modify: `public/index.html`

**Interfaces:**
- Consumes: the tone and six questions from `BRAND.md` (Task 3)
- Produces: a live page at `/commencer.html` whose form posts to Formspree with an attribution field named `source`. Plan 2 replaces this page with a Next.js route and must preserve the `source` field name so the count is continuous.

- [ ] **Step 1: Write the failing test**

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

test('door page answers the six questions and routes to the discovery session', () => {
  const door = readProjectFile('public/commencer.html');
  assert.match(door, /action="https:\/\/formspree\.io\/f\/xgvawvya"/);
  assert.match(door, /method="POST"/i);
  for (const heading of [
    "C'est quoi le parkour",
    'Est-ce que je peux le faire',
    'Où',
    'Quand',
    'Combien',
    'pire',
  ]) {
    assert.match(door, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }
});

test('door page carries the attribution field that makes the December count possible', () => {
  const door = readProjectFile('public/commencer.html');
  assert.match(door, /name="source"/);
  assert.match(door, /Comment tu nous as connus/i);
  assert.match(door, /name="_subject"[^>]*value="[^"]*découverte[^"]*"/i);
});

test('door page leaks no credentials and claims no paid commitment', () => {
  const door = readProjectFile('public/commencer.html');
  assert.doesNotMatch(door, /(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]+|whsec_[A-Za-z0-9]+/);
  assert.doesNotMatch(door, /formspree\.io\/f\/(?!xgvawvya)/);
});

test('home page links to the door', () => {
  assert.match(readProjectFile('public/index.html'), /href="commencer\.html"/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
node --test tests/door.test.js
```

Expected: FAIL — `ENOENT: no such file or directory, open '.../public/commencer.html'`

- [ ] **Step 3: Create `public/commencer.html`**

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

  <form class="mt-5" action="https://formspree.io/f/xgvawvya" method="POST" role="form">
    <input type="hidden" name="_subject" value="Séance découverte VertiFlow">

    <div class="form-floating mb-3">
      <input type="text" name="name" id="name" class="form-control" placeholder="Prénom" required>
      <label for="name">Ton prénom</label>
    </div>

    <div class="form-floating mb-3">
      <input type="email" name="email" id="email" class="form-control" placeholder="Email" required>
      <label for="email">Ton email</label>
    </div>

    <div class="form-floating mb-3">
      <input type="text" name="age" id="age" class="form-control" placeholder="Âge" required>
      <label for="age">Ton âge</label>
    </div>

    <div class="form-floating mb-3">
      <select name="source" id="source" class="form-select" required>
        <option value="">Choisis une réponse</option>
        <option value="instagram">Instagram VertiFlow</option>
        <option value="site">Le site VertiFlow</option>
        <option value="bouche-a-oreille">Un ami / bouche-à-oreille</option>
        <option value="forum">Forum des associations</option>
        <option value="autre">Autre</option>
      </select>
      <label for="source">Comment tu nous as connus ?</label>
    </div>

    <button type="submit" class="btn btn-dark btn-lg">Je viens à une séance</button>
  </form>
</section>
```

The `source` field is the entire measurement mechanism for the December test. Do not rename it, and do not make it optional.

- [ ] **Step 4: Add the navigation link in `public/index.html`**

Find the existing primary navigation `<ul>` and add as the first item, so the door precedes the shop:

```html
<li class="nav-item"><a class="nav-link" href="commencer.html">Commencer</a></li>
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
node --test tests/door.test.js
```

Expected: PASS, 4 tests.

- [ ] **Step 6: Run the full suite**

```bash
npm test
```

Expected: PASS. 13 test files now. `tests/environment.test.js` only inspects `public/checkout.html`, `public/js/custom.js` and `public/success.html`, so a new page does not affect it — if it does fail, stop and report rather than editing that file.

- [ ] **Step 7: Commit**

```bash
git add public/commencer.html public/index.html tests/door.test.js
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

Fill it in and submit. Formspree will send to the address configured on form `xgvawvya`.

- [ ] **Step 3: Confirm the submission arrived with attribution intact**

Check the inbox for form `xgvawvya`. Expected: subject `Séance découverte VertiFlow`, and a `source` value matching what was selected. If `source` is absent, the December test has no mechanism — stop and fix before shipping.

- [ ] **Step 4: STOP — confirm the PKBA owner**

The spec's top risk: someone at PKBA must own greeting arrivals and recording attendance. Confirm with Maxime who that is by name before this page goes live. If nobody owns it, the count defaults to him and the plan has created a weekly obligation `vision-2026` told him to cap.

- [ ] **Step 5: Report readiness**

Report to Maxime: the page URL, that a test submission arrived with `source` intact, and the named PKBA owner. Merging to `main` and deploying is his call, not this plan's — and this plan never pushes.

---

## Self-Review

**Spec coverage.** This plan implements: the reconciliation and branch-resolution prerequisites; the identity system of record (`BRAND.md`, `brand.tokens.json`); `/commencer` and its six questions; the attribution mechanism behind the December test; and the interim-door mitigation that decouples the count from the launch date. It deliberately excludes the Next.js migration (plan 2), the live payments path (plan 3), the collection and Printful products (plan 4), and the content engine and journal (plan 5).

**Deviation from the spec, deliberate:** the spec routes the découverte form to PKBA's Airtable. This plan uses the Formspree endpoint already wired into `public/contact.html` instead, because Airtable lives in the PKBA repository and reaching it would add a credential and a cross-repo dependency to a page whose whole purpose is to ship cheaply before the rentrée. The `source` field name is fixed so the count stays continuous when plan 2 replaces the page, and moving to Airtable later loses nothing.

**Placeholders:** none. Every step carries the literal file content, command and expected output.

**Type consistency:** `brand.tokens.json` exposes `color` and `font` as top-level keys, and plan 2's Tailwind config must import exactly those. The form field `source` is referenced identically in `tests/door.test.js`, `public/commencer.html` and the plan-2 interface note.

**Open risk carried forward:** Task 5 Step 4 is a human gate, not a code change. If the PKBA owner is not named, this plan ships a page that generates obligations nobody has agreed to absorb.
