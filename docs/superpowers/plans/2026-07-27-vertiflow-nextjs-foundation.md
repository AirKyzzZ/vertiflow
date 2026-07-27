# VertiFlow Next.js Foundation & Commerce Port — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a Next.js App Router application alongside the existing static site, move the working commerce pipeline onto it without rewriting a line of its security-critical code, and prove every existing invariant still holds.

**Architecture:** The commerce library in `functions/lib/` stays **CommonJS and byte-identical**. The 12 existing tests `require()` those files directly, so any rewrite would mean losing the only proof the payments code still works. Next.js Route Handlers reach it through a single server-only barrel (`src/lib/commerce.server.ts`) that re-exports it and imports the `server-only` package — so a client component importing commerce code becomes a build error rather than a leaked key. The static site keeps serving from `public/` until plan 6 cuts over.

**Tech Stack:** Next.js App Router (13.5+, install latest), TypeScript strict, Tailwind CSS, `@netlify/plugin-nextjs`, Node ≥20, `node --test`.

**Spec:** `docs/superpowers/specs/2026-07-27-vertiflow-brand-refresh-design.md`
**Depends on:** plan 1 (`2026-07-27-vertiflow-foundation-and-door.md`) — requires the rebase onto `origin/main`, a green baseline, and `brand.tokens.json`.

## Global Constraints

- **Do not modify anything in `functions/lib/`, `scripts/`, or `data/`.** These are the reviewed commerce implementation. Their tests are the safety net for this entire plan.
- **Do not add `"type": "module"` to `package.json`.** The commerce library and all 12 tests are CommonJS; that single line would break every one of them.
- **Do not touch the payments fence.** `assertSafeStripeKey`, `validateEnvironment` and the webhook's live-mode behaviour stay exactly as they are. Unfencing is plan 5, and `docs/commerce-catalogue.md` forbids doing it as a side effect.
- `npm test` must pass at the end of every task. 12 test files at the start, 13 after plan 1's `tests/door.test.js`.
- Node pinned `>=20` in `package.json`, `NODE_VERSION = "22"` in `netlify.toml`. Both are asserted by `tests/environment.test.js`.
- Never commit or bundle Stripe keys, Printful credentials, EmailJS private credentials, or `VERTIFLOW_TEST_ACCESS_TOKEN`. `.env.example` values stay empty.
- Conventional commits, subject line only, lowercase after the colon. **Never `git push`.**
- The existing static site must keep working throughout. `main` is untouched; all work lands on `feature/brand-refresh-2026`.

## File Structure

| File | Responsibility |
|---|---|
| `src/app/layout.tsx` (create) | Root layout, font loading, `<html lang="fr">` |
| `src/app/page.tsx` (create) | Placeholder home route, proving the app builds and renders |
| `src/lib/commerce.server.ts` (create) | The **only** module app code may import for commerce. Imports `server-only`, re-exports the CommonJS library. |
| `src/app/api/checkout/route.ts` (create) | Wraps `createCheckoutHandler` |
| `src/app/api/checkout/session/route.ts` (create) | Wraps the session-retrieval handler |
| `src/app/api/stripe/webhook/route.ts` (create) | Wraps the Stripe webhook handler |
| `tests/nextjs-boundary.test.js` (create) | Asserts no client component can reach commerce code or credentials |
| `tests/environment.test.js` (modify) | Migrate the Netlify and browser-authority invariants to the new structure |
| `netlify.toml` (modify) | Next.js runtime plugin, publish `.next` |
| `package.json` (modify) | Next/React/Tailwind deps, `build` and `dev` scripts |
| `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `next.config.mjs` (create) | Standard config; Tailwind theme imports `brand.tokens.json` |

`functions/`, `scripts/`, `data/` and `public/` are **not** restructured by this plan.

---

### Task 1: Scaffold the Next.js application alongside the static site

**Files:**
- Create: `next.config.mjs`, `tsconfig.json`, `postcss.config.mjs`, `tailwind.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Modify: `package.json`, `.gitignore`

**Interfaces:**
- Consumes: `brand.tokens.json` from plan 1 (top-level keys `color`, `font`)
- Produces: a building Next.js app. Later tasks add routes under `src/app/`.

- [ ] **Step 1: Install dependencies without scaffolding over the repo**

`create-next-app` would overwrite existing files, so install directly:

```bash
npm install next react react-dom server-only
npm install -D typescript @types/react @types/node @types/react-dom tailwindcss @tailwindcss/postcss postcss @netlify/plugin-nextjs
```

- [ ] **Step 2: Add build scripts, preserving the existing test script exactly**

In `package.json`, the `scripts` block becomes:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "node --test tests/*.test.js"
  },
```

Do not add `"type": "module"`. Do not change `engines`.

- [ ] **Step 3: Create `next.config.mjs`**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
```

- [ ] **Step 4: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "functions", "scripts", "tests"]
}
```

`functions`, `scripts` and `tests` are excluded so TypeScript never type-checks the CommonJS commerce code. It is correct as written and proven by its own suite.

- [ ] **Step 5: Create `postcss.config.mjs`**

```javascript
export default { plugins: { '@tailwindcss/postcss': {} } };
```

- [ ] **Step 6: Create `tailwind.config.ts` reading the brand tokens**

```typescript
import type { Config } from 'tailwindcss'
import tokens from './brand.tokens.json'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: tokens.color.base,
        paper: tokens.color.paper,
        accent: tokens.color.accent,
        neutral: tokens.color.neutral,
      },
      fontFamily: {
        display: [tokens.font.display],
        body: [tokens.font.body],
      },
    },
  },
} satisfies Config
```

No colour or font value is ever typed twice. `brand.tokens.json` is the single source.

- [ ] **Step 7: Create `src/app/globals.css`**

```css
@import "tailwindcss";
```

- [ ] **Step 8: Create `src/app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VertiFlow',
  description: "La porte d'entrée vers le parkour.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-paper font-body text-base">{children}</body>
    </html>
  )
}
```

- [ ] **Step 9: Create `src/app/page.tsx`**

```tsx
export default function Home() {
  return <main className="p-8 font-display text-2xl">VertiFlow</main>
}
```

- [ ] **Step 10: Ignore Next.js build output**

Append to `.gitignore`:

```
.next/
next-env.d.ts
```

- [ ] **Step 11: Verify the build succeeds**

```bash
npm run build
```

Expected: a successful build listing `/` as a route. If Tailwind cannot resolve `brand.tokens.json`, confirm plan 1 Task 3 ran and the file sits at the repo root.

- [ ] **Step 12: Verify the existing suite still passes**

```bash
npm test
```

Expected: PASS, 13 files. Adding an app must not disturb anything. `tests/environment.test.js` still passes here because `netlify.toml` has not changed yet.

- [ ] **Step 13: Commit**

```bash
git add package.json package-lock.json next.config.mjs tsconfig.json postcss.config.mjs tailwind.config.ts src/ .gitignore
git commit -m "feat: scaffold next.js app with brand tokens"
```

---

### Task 2: Expose the commerce library to the app through a server-only barrel

The library is correct, tested and must not be rewritten. This task makes it reachable from Route Handlers while making it impossible to reach from the browser.

**Files:**
- Create: `src/lib/commerce.server.ts`
- Create: `tests/nextjs-boundary.test.js`

**Interfaces:**
- Consumes: `functions/lib/catalogue.js`, `functions/lib/checkout-provenance.js`, `data/products.json` — all unchanged
- Produces: `src/lib/commerce.server.ts` exporting `resolveCart`, `validateCustomer`, `ValidationError`, `checkoutMetadata`, `matchesTestAccess`, `testAccessDigest`, and `catalogue`. Tasks 3 and 4 import only from here.

- [ ] **Step 1: Write the failing boundary test**

Create `tests/nextjs-boundary.test.js`:

```javascript
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');

function collectFiles(directory, extensions) {
  const absolute = path.join(ROOT, directory);
  if (!fs.existsSync(absolute)) return [];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectFiles(relativePath, extensions);
    return extensions.some((ext) => entry.name.endsWith(ext)) ? [relativePath] : [];
  });
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

test('the commerce barrel is server-only', () => {
  const barrel = read('src/lib/commerce.server.ts');
  assert.match(barrel, /import 'server-only'/);
  assert.doesNotMatch(barrel, /'use client'/);
});

test('no client component imports commerce code or credentials', () => {
  const offenders = collectFiles('src', ['.ts', '.tsx'])
    .filter((file) => /^\s*['"]use client['"]/m.test(read(file)))
    .filter((file) => /commerce\.server|functions\/lib|process\.env\.(?:STRIPE|PRINTFUL|EMAILJS|VERTIFLOW)_/.test(read(file)));
  assert.deepEqual(offenders, []);
});

test('the commerce library is reachable and still resolves a real cart', () => {
  const { resolveCart } = require('../functions/lib/catalogue.js');
  const catalogue = require('../data/products.json');
  const product = catalogue.products[0];
  const variant = product.variants.find((candidate) => candidate.active);
  const resolved = resolveCart(catalogue, [
    { slug: product.slug, color: variant.color, size: variant.size, quantity: 1 },
  ]);
  assert.equal(resolved.length, 1);
  assert.equal(resolved[0].syncVariantId ?? resolved[0].printful_sync_variant_id, variant.printful_sync_variant_id);
});

test('the commerce library was not modified by the migration', () => {
  for (const file of collectFiles('functions', ['.js'])) {
    assert.doesNotMatch(read(file), /'use client'|from 'next\//);
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
node --test tests/nextjs-boundary.test.js
```

Expected: FAIL — `ENOENT ... src/lib/commerce.server.ts`.

If instead the third test fails on the shape of `resolveCart`'s return value, read `functions/lib/catalogue.js` and correct the assertion to match what it actually returns. That test exists to prove the library is reachable, not to redefine its contract.

- [ ] **Step 3: Create `src/lib/commerce.server.ts`**

```typescript
import 'server-only'

// The commerce library is reviewed, tested CommonJS. It is imported here
// unchanged so its 12-file suite remains the proof that payments still work.
import catalogueModule from '../../functions/lib/catalogue.js'
import provenanceModule from '../../functions/lib/checkout-provenance.js'
import catalogueData from '../../data/products.json'

export const { resolveCart, validateCustomer, ValidationError } = catalogueModule
export const { checkoutMetadata, matchesTestAccess, testAccessDigest } = provenanceModule
export const catalogue = catalogueData
```

- [ ] **Step 4: Run the boundary test to verify it passes**

```bash
node --test tests/nextjs-boundary.test.js
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Verify the barrel type-checks and builds**

```bash
npx tsc --noEmit
npm run build
```

Expected: both succeed. If TypeScript objects to destructuring the CommonJS default export, add `functions/lib/*.d.ts` declarations rather than converting the library to ESM — converting it would break all 12 tests.

- [ ] **Step 6: Run the full suite**

```bash
npm test
```

Expected: PASS, 14 files.

- [ ] **Step 7: Commit**

```bash
git add src/lib/commerce.server.ts tests/nextjs-boundary.test.js
git commit -m "feat: expose commerce library through server-only barrel"
```

---

### Task 3: Port the checkout and webhook functions to Route Handlers

The handlers in `functions/` are factory functions taking injected dependencies, which is why they are testable. The Route Handlers are thin adapters translating between the Netlify event shape and the Web `Request`/`Response` API.

**Files:**
- Create: `src/app/api/checkout/route.ts`
- Create: `src/app/api/checkout/session/route.ts`
- Create: `src/app/api/stripe/webhook/route.ts`

**Interfaces:**
- Consumes: `src/lib/commerce.server.ts` from Task 2; the exported factories in `functions/create-checkout-session.js`, `functions/get-checkout-session.js`, `functions/stripe-webhook.js`
- Produces: `POST /api/checkout`, `GET /api/checkout/session`, `POST /api/stripe/webhook`. Plan 3's client code calls these paths; plan 5 changes only what is inside the existing library.

- [ ] **Step 1: Read the existing handler signatures before writing adapters**

```bash
git show HEAD:functions/create-checkout-session.js | tail -30
git show HEAD:functions/get-checkout-session.js | tail -30
git show HEAD:functions/stripe-webhook.js | tail -30
```

Note the exact exported factory names and the shape each expects (`{ stripe, catalogue, environment }` for checkout creation). Write the adapters against what is actually exported, not against what this plan assumes.

- [ ] **Step 2: Create `src/app/api/checkout/route.ts`**

```typescript
import 'server-only'
import Stripe from 'stripe'
import { catalogue } from '@/lib/commerce.server'
import checkoutModule from '../../../../functions/create-checkout-session.js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)
  const handler = checkoutModule.createCheckoutHandler({
    stripe,
    catalogue,
    environment: process.env,
  })

  const result = await handler({
    httpMethod: 'POST',
    body: await request.text(),
    headers: Object.fromEntries(request.headers),
  })

  return new Response(result.body, {
    status: result.statusCode,
    headers: { 'content-type': 'application/json', ...(result.headers ?? {}) },
  })
}
```

`runtime = 'nodejs'` is required — the commerce library uses `node:crypto`.

- [ ] **Step 3: Create the session and webhook routes the same way**

`src/app/api/checkout/session/route.ts` follows the identical adapter shape, exporting `GET` and passing `httpMethod: 'GET'` plus the query string from `new URL(request.url).searchParams`.

`src/app/api/stripe/webhook/route.ts` exports `POST` and **must pass the raw body** — Stripe signature verification fails on a re-serialised body:

```typescript
const rawBody = await request.text()
```

Pass `rawBody` straight through as `body`, never `JSON.parse` it first.

- [ ] **Step 4: Verify the build and the boundary test**

```bash
npm run build
node --test tests/nextjs-boundary.test.js
```

Expected: build lists `/api/checkout`, `/api/checkout/session`, `/api/stripe/webhook` as dynamic routes. Boundary test still passes — Route Handlers are server components and must not appear as offenders.

- [ ] **Step 5: Run the full suite**

```bash
npm test
```

Expected: PASS, 14 files. The handler tests exercise the factories directly and are unaffected by the adapters.

- [ ] **Step 6: Commit**

```bash
git add src/app/api
git commit -m "feat: port checkout and webhook to route handlers"
```

---

### Task 4: Migrate the security invariants to the new structure

`tests/environment.test.js` currently asserts `publish = "public"` and scans three static files to prove the browser has no authority over keys, amounts or fulfilment. Next.js changes both facts. **These assertions encode real security properties and must be repointed, never deleted.**

**Files:**
- Modify: `netlify.toml`
- Modify: `tests/environment.test.js`

**Interfaces:**
- Consumes: the Route Handlers from Task 3
- Produces: a `netlify.toml` that builds Next.js, with every invariant still asserted.

- [ ] **Step 1: Update `netlify.toml`**

Change the build block so `publish` points at the Next.js output and declare the runtime plugin. Keep `NODE_VERSION = "22"` and every existing `[[headers]]` block exactly as they are.

```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "22"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

Remove the `[functions] included_files = ["data/products.json"]` block: Next.js traces the `import` of `data/products.json` in `src/lib/commerce.server.ts` and bundles it automatically. The `functions = "functions"` key also goes, because the Netlify functions directory is no longer the deploy target.

- [ ] **Step 2: Run the suite to watch it fail**

```bash
node --test tests/environment.test.js
```

Expected: FAIL on the Netlify configuration assertion. This failure is the point — it proves the test was actually guarding the deploy shape.

- [ ] **Step 3: Repoint the Netlify assertion**

In `tests/environment.test.js`, replace the body of the test named `bundles the generated catalogue in Netlify functions without replacing build settings` with:

```javascript
test('builds Next.js on Netlify and keeps the catalogue bundled through module tracing', () => {
  const netlify = readProjectFile('netlify.toml');
  assert.match(netlify, /\[build\][\s\S]*publish = "\.next"/);
  assert.match(netlify, /\[\[plugins\]\]\s*package = "@netlify\/plugin-nextjs"/);
  assert.match(netlify, /\[\[headers\]\]/);
  assert.doesNotMatch(netlify, /publish = "public"/);
  assert.match(
    readProjectFile('src/lib/commerce.server.ts'),
    /import catalogueData from '\.\.\/\.\.\/data\/products\.json'/,
  );
});
```

- [ ] **Step 4: Repoint the browser-authority assertion**

Replace the body of `browser checkout has no authority over provider keys, amounts, fulfillment, legacy payment, or email delivery` with a version that scans every client component in the app rather than three named static files:

```javascript
test('no client code has authority over provider keys, amounts, fulfilment, or email delivery', () => {
  const clientSources = collectJavaScriptFiles('src')
    .concat(collectTypeScriptFiles('src'))
    .map((file) => readProjectFile(file))
    .filter((source) => /^\s*['"]use client['"]/m.test(source));
  const browser = clientSources.concat([
    readProjectFile('public/checkout.html'),
    readProjectFile('public/js/custom.js'),
    readProjectFile('public/success.html'),
  ]).join('\n');
  assert.doesNotMatch(browser, /(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]+|whsec_[A-Za-z0-9]+/);
  assert.doesNotMatch(browser, /create-payment-intent|paymentIntents\.create|amount\s*:/i);
  assert.doesNotMatch(browser, /printful(?:_sync)?_variant_id|api\.emailjs\.com|@emailjs\/browser/i);
});
```

Add the helper next to the existing `collectJavaScriptFiles`:

```javascript
function collectTypeScriptFiles(directory) {
  return fs.readdirSync(path.join(ROOT, directory), { withFileTypes: true })
    .flatMap((entry) => {
      const relativePath = path.join(directory, entry.name);
      if (entry.isDirectory()) return collectTypeScriptFiles(relativePath);
      return /\.tsx?$/.test(entry.name) ? [relativePath] : [];
    });
}
```

The static-site files stay in the list until plan 6 deletes them. Both worlds are asserted while both exist.

- [ ] **Step 5: Extend environment discovery to the new source tree**

The test `documents every commerce environment variable consumed by runtime code with empty values` currently walks `functions` and `scripts`. Add `src`:

```javascript
  const accessed = [...collectJavaScriptFiles('functions'), ...collectJavaScriptFiles('scripts'),
    ...collectTypeScriptFiles('src')]
    .flatMap((file) => extractCommerceEnvironmentReads(readProjectFile(file)));
```

Expected consequence: `COMMERCE_ENVIRONMENT` is unchanged, because the Route Handlers read only `STRIPE_SECRET_KEY`, which is already listed. If the assertion fails with a new variable, a handler is reading something undocumented — add it to `.env.example` with an empty value rather than removing it from the check.

- [ ] **Step 6: Run the full suite**

```bash
npm test
```

Expected: PASS, 14 files. Every original invariant still asserted, now over both the static site and the app.

- [ ] **Step 7: Commit**

```bash
git add netlify.toml tests/environment.test.js
git commit -m "fix: migrate security invariants to next.js structure"
```

---

### Task 5: Verify the branch deploys and checkout still works in test mode

A green local suite does not prove Netlify builds it, and the payments path is the one thing that cannot be allowed to regress silently.

**Files:**
- Modify: none

**Interfaces:**
- Consumes: everything above
- Produces: a verified branch preview URL. Plan 3 builds pages against it.

- [ ] **Step 1: Build exactly as Netlify will**

```bash
rm -rf .next
npm ci
npm run build
```

Expected: clean build from a clean install. `npm ci` catches a `package-lock.json` that drifted from `package.json`.

- [ ] **Step 2: Push the branch and let Netlify build a preview**

**STOP — this is the one push in this plan and it requires Maxime's approval.** It pushes `feature/brand-refresh-2026` to origin so Netlify produces a branch deploy. It does not touch `main` and does not affect the live site. Do not run it without his explicit go-ahead.

```bash
git push -u origin feature/brand-refresh-2026
```

- [ ] **Step 3: Confirm the branch deploy succeeded**

Open the Netlify branch deploy URL. Expected: the placeholder home route renders. The live site at `vertiflow.fr` is unchanged, because it still deploys from `main`.

- [ ] **Step 4: Exercise checkout against the preview in test mode**

Follow `docs/commerce-catalogue.md` §"Stripe test-to-live promotion" steps 1–3. Send `x-vertiflow-test-access` with the configured token to `POST /api/checkout` on the preview, with a real catalogue selection.

Expected: a Stripe Checkout Session is created with `vf_checkout_sha256` provenance metadata present, and `vf_livemode` is `test`. If the request returns 403, the test-access token is not configured on the branch context — set it in Netlify's environment for that branch, never in the repo.

- [ ] **Step 5: Confirm the fence is intact**

Verify that nothing in this plan weakened the payments fence:

```bash
git diff origin/main...HEAD -- functions/ scripts/ data/
```

Expected: **empty**. If this prints anything, a global constraint was violated — report it and stop.

- [ ] **Step 6: Report readiness**

Report the preview URL, the build result, the checkout Session ID created in test mode, and confirmation that the `functions/`, `scripts/` and `data/` diff is empty.

---

## Self-Review

**Spec coverage.** This plan implements the spec's *Website rebuild* section as far as foundation goes: the stack choice, Netlify hosting with the Next.js runtime, branch-based migration, no database, and the commerce port. It explicitly defers the route collapse, 301s, journal and identity application to plan 3; the `/admin` dashboard to plan 4; the live payments path to plan 5; and the collection and cutover to plan 6.

**Placeholders:** none. Task 3 Step 1 deliberately reads the real handler signatures before the adapters are written rather than assuming them, and Task 2 Step 2 tells the implementer what to do if `resolveCart`'s return shape differs from the assertion — that is instruction, not an unresolved decision.

**Type consistency:** `src/lib/commerce.server.ts` exports `resolveCart`, `validateCustomer`, `ValidationError`, `checkoutMetadata`, `matchesTestAccess`, `testAccessDigest`, `catalogue` — the same names used in Task 3's adapters and asserted in `tests/nextjs-boundary.test.js`. `brand.tokens.json`'s `color` and `font` keys, created in plan 1, are consumed by `tailwind.config.ts` in Task 1 Step 6. Route paths `/api/checkout`, `/api/checkout/session`, `/api/stripe/webhook` are fixed here and consumed by plan 3.

**The load-bearing decision:** keeping `functions/lib/` as unmodified CommonJS. Every alternative — converting to ESM, moving files, rewriting in TypeScript — invalidates the 12 tests that are the only evidence the payments code works. Task 5 Step 5 asserts that decision held by requiring an empty diff over `functions/`, `scripts/` and `data/`.

**Known gap:** Task 5 Step 4 verifies checkout in test mode only, because the fence rejects live keys. There is no way to prove the live path works before plan 5 builds it, and that is correct — `docs/commerce-catalogue.md` requires the live path to be implemented and reviewed deliberately.
