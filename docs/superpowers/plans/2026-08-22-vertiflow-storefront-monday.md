# VertiFlow Storefront — Monday Launch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put a Next.js storefront on `vertiflow.fr` that takes real money from strangers, live before the Instagram post on Monday 25 August 2026.

**Architecture:** The commerce backend already exists and is covered by 177 passing tests — Stripe Checkout in `elements` mode, a Printful client, EmailJS, and a provenance-verifying webhook. This plan builds the Next.js presentation layer over it, then lifts seven guards that currently make a live sale impossible. The backend is not rewritten.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4 (CSS-first `@theme`), TypeScript strict, `@stripe/stripe-js`, `@next/mdx`, Netlify.

**Spec:** `docs/superpowers/specs/2026-08-22-vertiflow-storefront-nextjs-design.md`

## Global Constraints

- **Zero comments** in code. Naming carries the documentation. This is binding, not stylistic.
- Files kebab-case, components PascalCase, functions camelCase, types PascalCase.
- Named exports, except Next.js `page.tsx`/`layout.tsx` which require a default (export both, as the existing `src/app/page.tsx:149` does).
- TypeScript strict. Never `any` — use `unknown` with type guards.
- French copy throughout. Tutoiement. Short sentences.
- Currency is EUR. Prices are strings in `data/products.json` (`"29.99"`), formatted by `formatPrice` as `29,99 €`.
- Client cart is never trusted. `resolveCart` re-prices server-side from `data/products.json`.
- The 177 existing tests must stay green after every task. Run `npm test`.
- Quantity bounds: 1–10 per line, max 100 lines per cart (`functions/lib/catalogue.js:47,67`).
- Product slugs, all 9: `tshirt-climb`, `hoodie-vf-definition`, `casquette-vf`, `shorts-performance-vf`, `coque-iphone-vf`, `debardeur-vf`, `cache-cou-vf`, `bob-vf`, `short-confort-vf`.
- Design tokens exist in `src/app/globals.css` `@theme`: `ink`, `paper`, `accent`, `neutral-100..900`, plus `display`, `eyebrow`, `grain`, `rule-marker` utilities. Use them; do not introduce new colours.

---

## File Structure

**Created:**
- `src/lib/cart.ts` — cart types, reducer, `localStorage` serialisation and legacy migration
- `src/components/cart-provider.tsx` — React context over the reducer
- `src/components/cart-count.tsx` — header badge
- `src/components/variant-picker.tsx` — colour/size selection, handles the 46-variant single-axis case
- `src/components/add-to-cart.tsx` — client button
- `src/components/prose.tsx` — typography wrapper for all MDX content
- `src/components/checkout-form.tsx` — customer fields + Stripe Payment Element
- `src/app/boutique/page.tsx` — product grid
- `src/app/boutique/[slug]/page.tsx` — product detail
- `src/app/panier/page.tsx` — cart
- `src/app/commande/page.tsx` — checkout
- `src/app/commande/succes/page.tsx` — confirmation
- `src/app/commande/annulee/page.tsx` — cancelled
- `src/app/(legal)/cgv/page.mdx`, `mentions-legales/page.mdx`, `confidentialite/page.mdx`, `livraison-et-paiement/page.mdx`
- `src/app/(legal)/layout.tsx` — wraps legal MDX in `<Prose>`
- `mdx-components.tsx` — required at project root by `@next/mdx`
- `tests/cart.test.js` — cart reducer and migration
- `tests/redirects.test.js` — redirect map coverage
- `tests/catalogue-price-mode.test.js` — mode-keyed price selection

**Modified:**
- `package.json` — add `@stripe/stripe-js`, `@next/mdx`, `@mdx-js/react`
- `next.config.mjs` — MDX plugin, `pageExtensions`, redirect map
- `src/app/layout.tsx` — wrap in `CartProvider`
- `src/components/site-header.tsx` — cart badge, `/boutique` link already present
- `src/lib/catalogue.ts` — mode-keyed price accessor
- `functions/lib/catalogue.js` — mode-keyed price resolution
- `functions/create-checkout-session.js` — guards 1, 2; `return_url`
- `functions/get-checkout-session.js` — guard 7
- `functions/stripe-webhook.js` — guards 5, 6
- `scripts/sync-stripe-prices.js` — guard 4
- `data/products.json`, `data/products.schema.json` — mode-keyed `stripe_price_id`

**Deleted:**
- `public/sign-in.html`, `public/sign-up.html`, `public/no-color.html`, `public/details-produit.html`, `public/product-detail.html`

---

### Task 1: Dependencies and MDX foundation

**Files:**
- Modify: `package.json`, `next.config.mjs`
- Create: `mdx-components.tsx`, `src/components/prose.tsx`

**Interfaces:**
- Produces: `Prose` component accepting `{children: React.ReactNode}`; MDX pages resolvable as `page.mdx`

- [ ] **Step 1: Install dependencies**

```bash
npm install @stripe/stripe-js @next/mdx @mdx-js/react
```

- [ ] **Step 2: Configure MDX in `next.config.mjs`**

```js
import createMDX from '@next/mdx'

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  pageExtensions: ['ts', 'tsx', 'mdx'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'files.cdn.printful.com' }],
  },
}

export default createMDX({})(nextConfig)
```

- [ ] **Step 3: Create `mdx-components.tsx` at project root**

`@next/mdx` requires this file at the root, not in `src/`. The build fails without it.

```tsx
import type { MDXComponents } from 'mdx/types'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return { ...components }
}
```

- [ ] **Step 4: Create `src/components/prose.tsx`**

```tsx
export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-20 lg:px-10 lg:py-28 [&_a]:text-accent [&_a]:underline [&_h1]:display [&_h1]:mb-10 [&_h1]:text-4xl [&_h2]:display [&_h2]:mb-4 [&_h2]:mt-14 [&_h2]:text-xl [&_li]:mb-2 [&_ol]:mb-6 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-5 [&_p]:leading-relaxed [&_p]:text-neutral-700 [&_ul]:mb-6 [&_ul]:list-disc [&_ul]:pl-5">
      {children}
    </div>
  )
}
```

- [ ] **Step 5: Verify the build still passes**

Run: `npm run build`
Expected: success, no MDX resolution errors

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json next.config.mjs mdx-components.tsx src/components/prose.tsx
git commit -m "feat: mdx foundation and prose component"
```

---

### Task 2: Cart state

**Files:**
- Create: `src/lib/cart.ts`, `tests/cart.test.js`
- Create: `src/components/cart-provider.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: nothing
- Produces: `CartLine = {slug: string, color: string, size: string, quantity: number}`; `readCart(raw: string | null): CartLine[]`; `addLine(lines, line)`; `setQuantity(lines, index, quantity)`; `removeLine(lines, index)`; `CART_STORAGE_KEY = 'cart'`; `useCart()` returning `{lines, add, setQuantity, remove, clear, count}`

- [ ] **Step 1: Write the failing tests**

The legacy shape is the important case. `public/js/custom.js:110` writes `{id, displayPrice, size, color, quantity, image}` — keyed `id`, with a cached price and image. We migrate to `slug` and drop the cached fields.

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { readCart, addLine, setQuantity, removeLine } = require('../src/lib/cart.ts');

test('legacy cart items keyed by id migrate to slug and drop cached fields', () => {
  const legacy = JSON.stringify([
    { id: 'tshirt-climb', displayPrice: '29.99', size: 'M', color: 'Noir', quantity: 2, image: 'https://x/y.png' },
  ]);
  assert.deepEqual(readCart(legacy), [
    { slug: 'tshirt-climb', color: 'Noir', size: 'M', quantity: 2 },
  ]);
});

test('malformed storage resets to an empty cart instead of throwing', () => {
  assert.deepEqual(readCart('not json'), []);
  assert.deepEqual(readCart(null), []);
  assert.deepEqual(readCart('{"not":"an array"}'), []);
});

test('lines with an unusable quantity are dropped', () => {
  const raw = JSON.stringify([
    { slug: 'bob-vf', color: 'Noir', size: 'Unique', quantity: 0 },
    { slug: 'bob-vf', color: 'Noir', size: 'Unique', quantity: 3 },
  ]);
  assert.deepEqual(readCart(raw), [{ slug: 'bob-vf', color: 'Noir', size: 'Unique', quantity: 3 }]);
});

test('adding a duplicate variant merges quantity and caps at ten', () => {
  const lines = [{ slug: 'bob-vf', color: 'Noir', size: 'Unique', quantity: 8 }];
  const merged = addLine(lines, { slug: 'bob-vf', color: 'Noir', size: 'Unique', quantity: 5 });
  assert.equal(merged.length, 1);
  assert.equal(merged[0].quantity, 10);
});

test('adding a different variant of the same product appends a line', () => {
  const lines = [{ slug: 'tshirt-climb', color: 'Noir', size: 'M', quantity: 1 }];
  const next = addLine(lines, { slug: 'tshirt-climb', color: 'Noir', size: 'L', quantity: 1 });
  assert.equal(next.length, 2);
});

test('setQuantity clamps to the one-to-ten server bound', () => {
  const lines = [{ slug: 'bob-vf', color: 'Noir', size: 'Unique', quantity: 3 }];
  assert.equal(setQuantity(lines, 0, 99)[0].quantity, 10);
  assert.equal(setQuantity(lines, 0, 0)[0].quantity, 1);
});

test('removeLine drops only the targeted index', () => {
  const lines = [
    { slug: 'bob-vf', color: 'Noir', size: 'Unique', quantity: 1 },
    { slug: 'casquette-vf', color: 'Noir', size: 'Unique', quantity: 1 },
  ];
  assert.deepEqual(removeLine(lines, 0), [{ slug: 'casquette-vf', color: 'Noir', size: 'Unique', quantity: 1 }]);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/cart.test.js`
Expected: FAIL, cannot find module `../src/lib/cart.ts`

- [ ] **Step 3: Implement `src/lib/cart.ts`**

Pure functions, no React, so the test can require them directly.

```ts
export type CartLine = {
  slug: string
  color: string
  size: string
  quantity: number
}

export const CART_STORAGE_KEY = 'cart'

const MIN_QUANTITY = 1
const MAX_QUANTITY = 10
const MAX_LINES = 100

function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return MIN_QUANTITY
  return Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, Math.floor(quantity)))
}

function toLine(value: unknown): CartLine | null {
  if (typeof value !== 'object' || value === null) return null
  const record = value as Record<string, unknown>
  const slug = typeof record.slug === 'string' ? record.slug : record.id
  const { color, size, quantity } = record
  if (typeof slug !== 'string' || !slug) return null
  if (typeof color !== 'string' || !color) return null
  if (typeof size !== 'string' || !size) return null
  if (!Number.isInteger(quantity) || (quantity as number) < MIN_QUANTITY) return null
  return { slug, color, size, quantity: clampQuantity(quantity as number) }
}

export function readCart(raw: string | null): CartLine[] {
  if (!raw) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []
  return parsed.map(toLine).filter((line): line is CartLine => line !== null).slice(0, MAX_LINES)
}

function sameVariant(a: CartLine, b: CartLine): boolean {
  return a.slug === b.slug && a.color === b.color && a.size === b.size
}

export function addLine(lines: CartLine[], line: CartLine): CartLine[] {
  const index = lines.findIndex((existing) => sameVariant(existing, line))
  if (index === -1) return [...lines, { ...line, quantity: clampQuantity(line.quantity) }].slice(0, MAX_LINES)
  return lines.map((existing, position) =>
    position === index
      ? { ...existing, quantity: clampQuantity(existing.quantity + line.quantity) }
      : existing,
  )
}

export function setQuantity(lines: CartLine[], index: number, quantity: number): CartLine[] {
  return lines.map((line, position) =>
    position === index ? { ...line, quantity: clampQuantity(quantity) } : line,
  )
}

export function removeLine(lines: CartLine[], index: number): CartLine[] {
  return lines.filter((_, position) => position !== index)
}

export function countLines(lines: CartLine[]): number {
  return lines.reduce((total, line) => total + line.quantity, 0)
}
```

- [ ] **Step 4: Make the test runner able to load TypeScript**

Node 22+ strips types natively. Confirm `node --version` is ≥ 22; the repo declares `>=20` in `package.json` engines but `netlify.toml` builds on 22. If the local runtime is 20, add `--experimental-strip-types` to the `test` script instead of converting the module.

Run: `node --test tests/cart.test.js`
Expected: PASS, 7 tests

- [ ] **Step 5: Create `src/components/cart-provider.tsx`**

Hydration matters: reading `localStorage` during the first render causes a server/client mismatch. Read in an effect, and treat the first paint as an empty cart.

```tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import {
  CART_STORAGE_KEY,
  addLine,
  countLines,
  readCart,
  removeLine,
  setQuantity as setLineQuantity,
  type CartLine,
} from '@/lib/cart'

type CartContextValue = {
  lines: CartLine[]
  ready: boolean
  count: number
  add: (line: CartLine) => void
  setQuantity: (index: number, quantity: number) => void
  remove: (index: number) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setLines(readCart(window.localStorage.getItem(CART_STORAGE_KEY)))
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines))
  }, [lines, ready])

  const value: CartContextValue = {
    lines,
    ready,
    count: countLines(lines),
    add: (line) => setLines((current) => addLine(current, line)),
    setQuantity: (index, quantity) => setLines((current) => setLineQuantity(current, index, quantity)),
    remove: (index) => setLines((current) => removeLine(current, index)),
    clear: () => setLines([]),
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside CartProvider')
  return context
}
```

- [ ] **Step 6: Wrap the app in `src/app/layout.tsx`**

Add the import and wrap `SiteHeader`, `{children}`, `SiteFooter` in `<CartProvider>`.

- [ ] **Step 7: Run the full suite**

Run: `npm test`
Expected: 184 pass, 0 fail

- [ ] **Step 8: Commit**

```bash
git add src/lib/cart.ts src/components/cart-provider.tsx src/app/layout.tsx tests/cart.test.js
git commit -m "feat: cart state with legacy migration"
```

---

### Task 3: Shop listing and product detail

**Files:**
- Create: `src/app/boutique/page.tsx`, `src/app/boutique/[slug]/page.tsx`
- Create: `src/components/variant-picker.tsx`, `src/components/add-to-cart.tsx`

**Interfaces:**
- Consumes: `useCart()` from Task 2; `getProducts`, `getProduct`, `activeVariants`, `colours`, `sizes`, `coverImage`, `formatPrice` from `src/lib/catalogue.ts`; `ProductCard` from `src/components/product-card.tsx`
- Produces: `/boutique` and `/boutique/[slug]` routes

- [ ] **Step 1: Create `src/app/boutique/page.tsx`**

`ProductCard` already links to `/boutique/${slug}`, so the grid is assembly.

```tsx
import type { Metadata } from 'next'
import { ProductCard } from '@/components/product-card'
import { getProducts } from '@/lib/catalogue'

export const metadata: Metadata = {
  title: 'Boutique',
  description: 'Des vêtements de parkour faits pour bouger.',
}

export function Boutique() {
  const products = getProducts()

  return (
    <main className="mx-auto max-w-[88rem] px-5 py-20 lg:px-10 lg:py-28">
      <p className="eyebrow text-accent">{products.length} pièces</p>
      <h1 className="display mt-5 text-[clamp(2.5rem,7vw,5rem)]">Boutique</h1>
      <div className="mt-16 grid grid-cols-2 gap-x-5 gap-y-14 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </main>
  )
}

export default Boutique
```

- [ ] **Step 2: Create `src/components/variant-picker.tsx`**

`coque-iphone-vf` has 46 variants on one colour with many sizes (iPhone models). The other eight are a colour × size grid. One component handles both: when there is a single colour, the colour row is not rendered.

```tsx
'use client'

export function VariantPicker({
  palette,
  availableSizes,
  colour,
  size,
  onColour,
  onSize,
}: {
  palette: string[]
  availableSizes: string[]
  colour: string
  size: string
  onColour: (value: string) => void
  onSize: (value: string) => void
}) {
  return (
    <div className="mt-10 space-y-8">
      {palette.length > 1 && (
        <div>
          <p className="eyebrow text-neutral-500">Couleur</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {palette.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onColour(value)}
                className={`border px-4 py-2 text-sm transition-colors ${
                  value === colour
                    ? 'border-ink bg-ink text-paper'
                    : 'border-ink/20 text-neutral-700 hover:border-ink'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="eyebrow text-neutral-500">
          {availableSizes.length > 12 ? 'Modèle' : 'Taille'}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {availableSizes.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onSize(value)}
              className={`border px-4 py-2 text-sm transition-colors ${
                value === size
                  ? 'border-ink bg-ink text-paper'
                  : 'border-ink/20 text-neutral-700 hover:border-ink'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `src/components/add-to-cart.tsx`**

Holds the selection state, renders the picker, and pushes into the cart. Serialisable props only — `Product` from a server component is plain JSON, so it passes the boundary cleanly.

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/components/cart-provider'
import { VariantPicker } from '@/components/variant-picker'

export function AddToCart({
  slug,
  palette,
  sizesByColour,
}: {
  slug: string
  palette: string[]
  sizesByColour: Record<string, string[]>
}) {
  const { add } = useCart()
  const [colour, setColour] = useState(palette[0])
  const [size, setSize] = useState(sizesByColour[palette[0]][0])
  const [added, setAdded] = useState(false)

  const availableSizes = sizesByColour[colour] ?? []

  function selectColour(value: string) {
    setColour(value)
    const next = sizesByColour[value] ?? []
    if (!next.includes(size)) setSize(next[0])
    setAdded(false)
  }

  return (
    <>
      <VariantPicker
        palette={palette}
        availableSizes={availableSizes}
        colour={colour}
        size={size}
        onColour={selectColour}
        onSize={(value) => {
          setSize(value)
          setAdded(false)
        }}
      />

      <button
        type="button"
        onClick={() => {
          add({ slug, color: colour, size, quantity: 1 })
          setAdded(true)
        }}
        className="mt-10 w-full bg-ink px-8 py-4 text-paper transition-opacity hover:opacity-90"
      >
        <span className="eyebrow">Ajouter au panier</span>
      </button>

      {added && (
        <Link href="/panier" className="eyebrow mt-4 block text-center text-accent underline">
          Voir le panier
        </Link>
      )}
    </>
  )
}
```

- [ ] **Step 4: Create `src/app/boutique/[slug]/page.tsx`**

`params` is a Promise in Next 15+ and must be awaited.

```tsx
import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { AddToCart } from '@/components/add-to-cart'
import {
  colours,
  coverImage,
  formatPrice,
  getProduct,
  getProducts,
  sizes,
} from '@/lib/catalogue'

export function generateStaticParams() {
  return getProducts().map((product) => ({ slug: product.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = getProduct(slug)
  if (!product) return {}
  return { title: product.name }
}

export async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = getProduct(slug)
  if (!product) notFound()

  const palette = colours(product)
  const sizesByColour = Object.fromEntries(
    palette.map((colour) => [colour, sizes(product, colour)]),
  )

  return (
    <main className="mx-auto grid max-w-[88rem] gap-12 px-5 py-16 lg:grid-cols-2 lg:gap-20 lg:px-10 lg:py-24">
      <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
        <Image
          src={coverImage(product)}
          alt={product.name}
          fill
          priority
          sizes="(min-width: 1024px) 45vw, 90vw"
          className="object-cover"
        />
      </div>

      <div className="lg:pt-8">
        <h1 className="display text-[clamp(2rem,5vw,3.5rem)]">{product.name}</h1>
        <p className="mt-4 text-xl text-neutral-700">{formatPrice(product.price)}</p>
        <AddToCart slug={product.slug} palette={palette} sizesByColour={sizesByColour} />
        <p className="mt-8 text-xs leading-relaxed text-neutral-500">
          Imprimé et expédié à la demande. Compte 5 à 10 jours ouvrés.
        </p>
      </div>
    </main>
  )
}

export default ProductPage
```

- [ ] **Step 5: Verify both routes render**

Run: `npm run build`
Expected: success, and the build log lists 9 static params for `/boutique/[slug]`

- [ ] **Step 6: Commit**

```bash
git add src/app/boutique src/components/variant-picker.tsx src/components/add-to-cart.tsx
git commit -m "feat: shop listing and product detail"
```

---

### Task 4: Cart page and header badge

**Files:**
- Create: `src/app/panier/page.tsx`, `src/components/cart-count.tsx`
- Modify: `src/components/site-header.tsx`

**Interfaces:**
- Consumes: `useCart()`; `getProduct`, `formatPrice`, `coverImage`
- Produces: `/panier` route

- [ ] **Step 1: Create `src/components/cart-count.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { useCart } from '@/components/cart-provider'

export function CartCount() {
  const { count, ready } = useCart()

  return (
    <Link href="/panier" className="eyebrow text-neutral-700 transition-colors hover:text-ink">
      Panier{ready && count > 0 ? ` (${count})` : ''}
    </Link>
  )
}
```

- [ ] **Step 2: Add `<CartCount />` to `src/components/site-header.tsx`**

Place it after the `nav` element in the desktop layout and inside the mobile `details` panel. Import from `@/components/cart-count`.

- [ ] **Step 3: Create `src/app/panier/page.tsx`**

Line totals are computed from the catalogue, never from storage. `catalogue.ts` is `server-only`, so the client page needs the product data passed in — read it in a server component and hand it to a client child.

```tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/components/cart-provider'
import catalogue from '../../../data/products.json'

type CatalogueProduct = {
  slug: string
  name: string
  price: string
  variants: { color: string; size: string; image_url: string }[]
}

const products = (catalogue as { products: CatalogueProduct[] }).products

function findProduct(slug: string) {
  return products.find((product) => product.slug === slug)
}

function formatEuros(amount: number): string {
  return `${amount.toFixed(2).replace('.', ',')} €`
}

export function Panier() {
  const { lines, ready, setQuantity, remove } = useCart()

  const priced = lines.map((line) => {
    const product = findProduct(line.slug)
    const unit = product ? Number(product.price) : 0
    const variant = product?.variants.find(
      (candidate) => candidate.color === line.color && candidate.size === line.size,
    )
    return { line, product, unit, total: unit * line.quantity, image: variant?.image_url }
  })

  const total = priced.reduce((sum, entry) => sum + entry.total, 0)

  if (!ready) return <main className="min-h-[60vh]" />

  if (lines.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-32 text-center lg:px-10">
        <h1 className="display text-4xl">Panier vide</h1>
        <p className="mt-5 text-neutral-700">Rien ici pour l&apos;instant.</p>
        <Link href="/boutique" className="eyebrow mt-10 inline-block bg-ink px-8 py-4 text-paper">
          Voir la boutique
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-20 lg:px-10 lg:py-28">
      <h1 className="display text-[clamp(2.5rem,7vw,4.5rem)]">Panier</h1>

      <ul className="mt-14 divide-y divide-ink/10 border-y border-ink/10">
        {priced.map(({ line, product, total: lineTotal, image }, index) => (
          <li key={`${line.slug}-${line.color}-${line.size}`} className="flex gap-5 py-6">
            <div className="relative h-28 w-24 shrink-0 overflow-hidden bg-neutral-100">
              {image && <Image src={image} alt="" fill sizes="96px" className="object-cover" />}
            </div>

            <div className="flex flex-1 flex-col justify-between">
              <div>
                <p className="font-medium">{product?.name ?? line.slug}</p>
                <p className="mt-1 text-xs text-neutral-500">
                  {line.color} · {line.size}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <select
                  value={line.quantity}
                  onChange={(event) => setQuantity(index, Number(event.target.value))}
                  className="border border-ink/20 bg-paper px-2 py-1 text-sm"
                >
                  {Array.from({ length: 10 }, (_, offset) => offset + 1).map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-xs text-neutral-500 underline hover:text-ink"
                >
                  Retirer
                </button>
              </div>
            </div>

            <p className="whitespace-nowrap text-sm">{formatEuros(lineTotal)}</p>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex items-baseline justify-between">
        <span className="eyebrow text-neutral-500">Sous-total</span>
        <span className="display text-2xl">{formatEuros(total)}</span>
      </div>
      <p className="mt-2 text-right text-xs text-neutral-500">Livraison calculée à l&apos;étape suivante.</p>

      <Link
        href="/commande"
        className="eyebrow mt-10 block bg-ink px-8 py-4 text-center text-paper transition-opacity hover:opacity-90"
      >
        Commander
      </Link>
    </main>
  )
}

export default Panier
```

- [ ] **Step 4: Verify**

Run: `npm run build && npm test`
Expected: build succeeds, 184 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/app/panier src/components/cart-count.tsx src/components/site-header.tsx
git commit -m "feat: cart page and header badge"
```

---

### Task 5: Checkout with Stripe Payment Element

**Files:**
- Create: `src/app/commande/page.tsx`, `src/components/checkout-form.tsx`
- Create: `src/app/commande/succes/page.tsx`, `src/app/commande/annulee/page.tsx`
- Modify: `functions/create-checkout-session.js:68`

**Interfaces:**
- Consumes: `useCart()`; `POST /api/checkout` returning `{clientSecret, sessionId, publishableKey}`; `POST /api/checkout/session` returning `{status, paymentStatus}`
- Produces: `/commande`, `/commande/succes`, `/commande/annulee`

**Required reading:** `functions/lib/catalogue.js` `validateCustomer` defines the exact customer shape the server accepts — `firstName`, `lastName`, `email`, `phone`, and an `address` object. Read it before writing the form so field names match; a mismatch returns a generic 400 that is painful to debug.

- [ ] **Step 1: Point the return URL at the new route**

In `functions/create-checkout-session.js`, change:

```js
return_url: `${siteUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
```

to:

```js
return_url: `${siteUrl}/commande/succes?session_id={CHECKOUT_SESSION_ID}`,
```

- [ ] **Step 2: Run the checkout tests**

Run: `node --test tests/create-checkout-session.test.js`
Expected: PASS, or a failure naming the old URL — if so, update the fixture to the new path

- [ ] **Step 3: Create `src/components/checkout-form.tsx`**

The backend uses `ui_mode: 'elements'`, so the browser flow is `initCheckout` → mount → `confirm`. Field names mirror `validateCustomer`.

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { useCart } from '@/components/cart-provider'

type CheckoutState = 'idle' | 'creating' | 'ready' | 'confirming'

export function CheckoutForm() {
  const { lines, clear } = useCart()
  const router = useRouter()
  const [state, setState] = useState<CheckoutState>('idle')
  const [error, setError] = useState<string | null>(null)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setState('creating')

    const data = new FormData(event.currentTarget)
    const customer = {
      firstName: String(data.get('firstName') ?? ''),
      lastName: String(data.get('lastName') ?? ''),
      email: String(data.get('email') ?? ''),
      phone: String(data.get('phone') ?? ''),
      address: {
        line1: String(data.get('line1') ?? ''),
        line2: String(data.get('line2') ?? ''),
        postal_code: String(data.get('postalCode') ?? ''),
        city: String(data.get('city') ?? ''),
        country: String(data.get('country') ?? 'FR'),
      },
    }

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: lines, customer, promoCode: String(data.get('promoCode') ?? '') }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? 'Paiement indisponible')

      const stripe = await loadStripe(payload.publishableKey)
      if (!stripe) throw new Error('Paiement indisponible')

      const checkout = await stripe.initCheckout({ clientSecret: payload.clientSecret })
      const paymentElement = checkout.createPaymentElement()
      paymentElement.mount('#payment-element')
      setState('ready')

      const container = document.getElementById('confirm-button')
      container?.addEventListener(
        'click',
        async () => {
          setState('confirming')
          const result = await checkout.confirm()
          if (result.type === 'error') {
            setError(result.error.message ?? 'Le paiement a échoué')
            setState('ready')
            return
          }
          clear()
          router.push('/commande/succes')
        },
        { once: true },
      )
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Paiement indisponible')
      setState('idle')
    }
  }

  const field = 'w-full border border-ink/20 bg-paper px-4 py-3 text-sm outline-none focus:border-ink'

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <input name="firstName" required placeholder="Prénom" className={field} />
        <input name="lastName" required placeholder="Nom" className={field} />
      </div>
      <input name="email" type="email" required placeholder="Email" className={field} />
      <input name="phone" placeholder="Téléphone (optionnel)" className={field} />
      <input name="line1" required placeholder="Adresse" className={field} />
      <input name="line2" placeholder="Complément (optionnel)" className={field} />
      <div className="grid grid-cols-2 gap-4">
        <input name="postalCode" required placeholder="Code postal" className={field} />
        <input name="city" required placeholder="Ville" className={field} />
      </div>
      <input name="country" defaultValue="FR" required placeholder="Pays" className={field} />
      <input name="promoCode" placeholder="Code promo (optionnel)" className={field} />

      {state === 'idle' && (
        <button type="submit" className="eyebrow w-full bg-ink px-8 py-4 text-paper">
          Continuer vers le paiement
        </button>
      )}
      {state === 'creating' && <p className="text-sm text-neutral-500">Préparation du paiement…</p>}

      <div id="payment-element" className="pt-4" />

      {state !== 'idle' && state !== 'creating' && (
        <button
          type="button"
          id="confirm-button"
          disabled={state === 'confirming'}
          className="eyebrow w-full bg-ink px-8 py-4 text-paper disabled:opacity-50"
        >
          {state === 'confirming' ? 'Paiement en cours…' : 'Payer'}
        </button>
      )}

      {error && <p className="text-sm text-red-700">{error}</p>}
    </form>
  )
}
```

- [ ] **Step 4: Create `src/app/commande/page.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { CheckoutForm } from '@/components/checkout-form'
import { useCart } from '@/components/cart-provider'

export function Commande() {
  const { lines, ready } = useCart()

  if (!ready) return <main className="min-h-[60vh]" />

  if (lines.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-32 text-center lg:px-10">
        <h1 className="display text-4xl">Panier vide</h1>
        <Link href="/boutique" className="eyebrow mt-10 inline-block bg-ink px-8 py-4 text-paper">
          Voir la boutique
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-xl px-5 py-20 lg:px-10 lg:py-28">
      <h1 className="display text-[clamp(2.5rem,7vw,4rem)]">Commande</h1>
      <div className="mt-12">
        <CheckoutForm />
      </div>
    </main>
  )
}

export default Commande
```

- [ ] **Step 5: Create `src/app/commande/succes/page.tsx`**

Confirmation only. Fulfilment is the webhook's job — a customer who closes this tab still gets their order.

```tsx
'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function Confirmation() {
  const sessionId = useSearchParams().get('session_id')
  const [paid, setPaid] = useState<boolean | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setPaid(false)
      return
    }
    fetch('/api/checkout/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
      .then((response) => response.json())
      .then((payload) => setPaid(payload.paymentStatus === 'paid'))
      .catch(() => setPaid(false))
  }, [sessionId])

  return (
    <main className="mx-auto max-w-2xl px-5 py-32 text-center lg:px-10">
      <p className="eyebrow text-accent">{paid === null ? 'Vérification' : paid ? 'Commande confirmée' : 'Statut'}</p>
      <h1 className="display mt-5 text-[clamp(2.5rem,7vw,4.5rem)]">
        {paid === false ? 'Paiement non confirmé' : 'Merci'}
      </h1>
      <p className="mt-6 text-neutral-700">
        {paid === false
          ? 'Si tu as été débité, écris-nous et on règle ça.'
          : 'Tu vas recevoir un email de confirmation. Compte 5 à 10 jours ouvrés.'}
      </p>
      <Link href="/boutique" className="eyebrow mt-12 inline-block bg-ink px-8 py-4 text-paper">
        Retour à la boutique
      </Link>
    </main>
  )
}

export function Succes() {
  return (
    <Suspense fallback={<main className="min-h-[60vh]" />}>
      <Confirmation />
    </Suspense>
  )
}

export default Succes
```

`useSearchParams` requires a `Suspense` boundary or the build fails with a prerender error.

- [ ] **Step 6: Create `src/app/commande/annulee/page.tsx`**

A static page: heading "Paiement annulé", a line saying the cart is intact, and a link back to `/panier`.

- [ ] **Step 7: Verify**

Run: `npm run build && npm test`
Expected: build succeeds, all tests pass

- [ ] **Step 8: Commit**

```bash
git add src/app/commande src/components/checkout-form.tsx functions/create-checkout-session.js
git commit -m "feat: checkout with stripe payment element"
```

---

### Task 6: Legal pages

**Files:**
- Create: `src/app/(legal)/layout.tsx`
- Create: `src/app/(legal)/cgv/page.mdx`, `mentions-legales/page.mdx`, `confidentialite/page.mdx`, `livraison-et-paiement/page.mdx`

**Interfaces:**
- Consumes: `Prose` from Task 1
- Produces: four legal routes

**These are legal documents.** Migrate the text verbatim from the corresponding `public/*.html`. Re-lay it out; do not rewrite, summarise, or improve the wording. Selling to French consumers without these is not lawful, which is why this task is in the launch set.

- [ ] **Step 1: Create the route group layout**

```tsx
import { Prose } from '@/components/prose'

export function LegalLayout({ children }: { children: React.ReactNode }) {
  return <Prose>{children}</Prose>
}

export default LegalLayout
```

- [ ] **Step 2: Extract the text from each legacy page**

For each pair, read the legacy file and lift the body copy:

| Legacy | New |
|---|---|
| `public/conditions-generales-de-vente.html` | `src/app/(legal)/cgv/page.mdx` |
| `public/mentions-legales.html` | `src/app/(legal)/mentions-legales/page.mdx` |
| `public/politique-de-confidentialite.html` | `src/app/(legal)/confidentialite/page.mdx` |
| `public/livraison-paiment.html` | `src/app/(legal)/livraison-et-paiement/page.mdx` |

Each MDX file starts with an exported title, then the migrated prose:

```mdx
export const metadata = { title: 'Conditions générales de vente' }

# Conditions générales de vente

...verbatim migrated content...
```

- [ ] **Step 3: Check the entity boundary**

`BRAND.md` is explicit: VertiFlow is a micro-entreprise, PKBA is an association loi 1901, same founder, two separate entities. Copy may say both were built by the same person; it must never read as one organisation. Verify the migrated mentions légales respects this, and flag rather than invent any SIRET, address, or hosting detail that is missing.

- [ ] **Step 4: Verify**

Run: `npm run build`
Expected: four new routes in the output

- [ ] **Step 5: Commit**

```bash
git add "src/app/(legal)"
git commit -m "feat: legal pages in the new brand"
```

---

### Task 7: Redirects and dead page removal

**Files:**
- Modify: `next.config.mjs`
- Delete: 5 files in `public/`
- Create: `tests/redirects.test.js`

**Interfaces:**
- Consumes: routes from Tasks 3–6
- Produces: `redirects()` in the Next config

Only redirect paths whose replacement now exists. `faq.html`, `blog.html`, `about.html`, `contact.html`, `guide-des-tailles.html` and the three event pages keep serving from `public/` until their Next replacements land in the follow-up plan. Redirecting them now would break working pages.

- [ ] **Step 1: Write the failing test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { redirectMap } = require('../src/lib/redirect-map.ts');

test('every ported legacy path redirects permanently', () => {
  const expected = {
    '/products.html': '/boutique',
    '/tshirt-climb.html': '/boutique/tshirt-climb',
    '/hoodie-vf-definition.html': '/boutique/hoodie-vf-definition',
    '/casquette-vf.html': '/boutique/casquette-vf',
    '/shorts-performance-vf.html': '/boutique/shorts-performance-vf',
    '/coque-vf.html': '/boutique/coque-iphone-vf',
    '/debardeur-vf.html': '/boutique/debardeur-vf',
    '/cache-cou-vf.html': '/boutique/cache-cou-vf',
    '/bob-vf.html': '/boutique/bob-vf',
    '/short-confort-vf.html': '/boutique/short-confort-vf',
    '/checkout.html': '/panier',
    '/success.html': '/commande/succes',
    '/cancel.html': '/commande/annulee',
    '/conditions-generales-de-vente.html': '/cgv',
    '/mentions-legales.html': '/mentions-legales',
    '/politique-de-confidentialite.html': '/confidentialite',
    '/livraison-paiment.html': '/livraison-et-paiement',
    '/sign-in.html': '/',
    '/sign-up.html': '/',
    '/no-color.html': '/boutique',
    '/details-produit.html': '/boutique',
    '/product-detail.html': '/boutique',
  };
  const actual = Object.fromEntries(redirectMap().map((rule) => [rule.source, rule.destination]));
  assert.deepEqual(actual, expected);
  assert.ok(redirectMap().every((rule) => rule.permanent === true));
});

test('unported pages are not redirected', () => {
  const sources = redirectMap().map((rule) => rule.source);
  for (const path of ['/faq.html', '/blog.html', '/about.html', '/contact.html', '/guide-des-tailles.html']) {
    assert.ok(!sources.includes(path), `${path} must keep serving until its replacement exists`);
  }
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test tests/redirects.test.js`
Expected: FAIL, cannot find `redirect-map.ts`

- [ ] **Step 3: Create `src/lib/redirect-map.ts`**

Export a `redirectMap()` returning the array in the test, every entry `{source, destination, permanent: true}`.

- [ ] **Step 4: Wire it into `next.config.mjs`**

```js
import { redirectMap } from './src/lib/redirect-map.ts'

const nextConfig = {
  // ...existing config
  async redirects() {
    return redirectMap()
  },
}
```

If importing a `.ts` module into the config fails on this Next version, inline the array in `next.config.mjs` and have the test import the config instead — the test must assert against whatever the build actually uses, not a copy.

- [ ] **Step 5: Delete the dead pages**

```bash
git rm public/sign-in.html public/sign-up.html public/no-color.html public/details-produit.html public/product-detail.html
```

- [ ] **Step 6: Verify**

Run: `npm test && npm run build`
Expected: all tests pass, build succeeds

- [ ] **Step 7: Commit**

```bash
git add next.config.mjs src/lib/redirect-map.ts tests/redirects.test.js
git commit -m "feat: redirect legacy urls and drop dead pages"
```

---

### Task 8: Fix production env scoping and deploy a preview

**Files:** none — this is Netlify configuration

**Interfaces:**
- Consumes: the deployed build from Tasks 1–7
- Produces: a working preview URL with checkout functioning end to end in test mode

The production 500 is a context-scoping bug. All credentials exist in the Netlify project; five are scoped to `deploy-preview` and `branch-deploy` but absent from `production`. `validateEnvironment` reads `STRIPE_PUBLISHABLE_KEY` first, so production throws `Stripe key modes must match` before reaching Stripe.

- [ ] **Step 1: Confirm the gap**

```bash
netlify env:list --context production
netlify env:list --context deploy-preview
```

Expected: production lacks `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SHIPPING_RATE_ID`, `STRIPE_WEBHOOK_SECRET`, `EMAILJS_PRIVATE_KEY`, `EMAILJS_CUSTOMER_TEMPLATE_ID`.

- [ ] **Step 2: Confirm the Stripe key mode with Maxime before touching anything**

`STRIPE_SECRET_KEY` and `STRIPE_SECRET_TEST_KEY` both exist. Which is live matters enormously — the guard lifts in Task 10 are what make live keys usable, and scoping a live key into production before then produces a hard 500 on every checkout. **Do not guess. Ask.**

- [ ] **Step 3: Scope the five variables to production**

For each, using the value already stored for `deploy-preview`:

```bash
netlify env:set STRIPE_PUBLISHABLE_KEY "<value>" --context production
netlify env:set STRIPE_SHIPPING_RATE_ID "<value>" --context production
netlify env:set STRIPE_WEBHOOK_SECRET "<value>" --context production
netlify env:set EMAILJS_PRIVATE_KEY "<value>" --context production
netlify env:set EMAILJS_CUSTOMER_TEMPLATE_ID "<value>" --context production
```

- [ ] **Step 4: Deploy a preview and rehearse**

```bash
netlify deploy --build
```

On the preview URL: browse `/boutique`, open a product, add to cart, check `/panier` totals, complete `/commande` with Stripe test card `4242 4242 4242 4242`, any future expiry, any CVC. Confirm the success page reports paid, a Printful draft appears in the dashboard, and both emails arrive.

- [ ] **Step 5: Record what the rehearsal showed**

Note any failure and fix before proceeding. A failure here is far cheaper than the same failure in Task 11.

- [ ] **Step 6: Promote to production**

```bash
netlify deploy --build --prod
```

Verify `curl -s -o /dev/null -w "%{http_code}" https://vertiflow.fr/api/checkout -X POST -d '{}'` no longer returns 404, and that `https://vertiflow.fr` serves the new home page.

---

### Task 9: Mode-keyed Stripe price IDs

**Files:**
- Modify: `data/products.schema.json`, `data/products.json`, `src/lib/catalogue.ts`, `functions/lib/catalogue.js`, `functions/stripe-webhook.js`
- Create: `tests/catalogue-price-mode.test.js`

**Interfaces:**
- Produces: `stripe_price_id` as `{test: string, live: string | null}`; `priceIdFor(variant, mode)` in both the TS and JS catalogue modules

This is what lets the 177 tests keep passing and lets you rehearse in test mode after going live.

- [ ] **Step 1: Write the failing test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { priceIdFor } = require('../functions/lib/catalogue.js');

test('price selection follows the active stripe mode', () => {
  const variant = { stripe_price_id: { test: 'price_test_1', live: 'price_live_1' } };
  assert.equal(priceIdFor(variant, 'test'), 'price_test_1');
  assert.equal(priceIdFor(variant, 'live'), 'price_live_1');
});

test('a variant with no price for the active mode is rejected', () => {
  const variant = { stripe_price_id: { test: 'price_test_1', live: null } };
  assert.throws(() => priceIdFor(variant, 'live'), /no live price/i);
});

test('the legacy flat string is still readable as a test price', () => {
  assert.equal(priceIdFor({ stripe_price_id: 'price_flat' }, 'test'), 'price_flat');
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test tests/catalogue-price-mode.test.js`
Expected: FAIL, `priceIdFor` is not a function

- [ ] **Step 3: Implement `priceIdFor` in `functions/lib/catalogue.js`**

```js
function priceIdFor(variant, mode) {
  const value = variant?.stripe_price_id;
  if (typeof value === 'string') {
    if (mode !== 'test') throw new Error(`Variant has no ${mode} price`);
    return value;
  }
  const resolved = value?.[mode];
  if (typeof resolved !== 'string' || !resolved) throw new Error(`Variant has no ${mode} price`);
  return resolved;
}
```

Export it, and mirror it in `src/lib/catalogue.ts`.

- [ ] **Step 4: Migrate `data/products.json`**

Write a one-off script that rewrites every variant's `stripe_price_id` from `"price_x"` to `{"test": "price_x", "live": null}` across all 107 variants, then delete the script. Update `data/products.schema.json` so `stripe_price_id` is an object with required `test` and nullable `live`.

- [ ] **Step 5: Update every consumer**

`resolveCart` in `functions/lib/catalogue.js` and the catalogue index in `functions/stripe-webhook.js` both read `stripe_price_id` directly. Route them through `priceIdFor` with the mode derived from the active Stripe key. Fixtures in `tests/` need the same shape update.

- [ ] **Step 6: Verify**

Run: `npm test`
Expected: all tests pass, including the three new ones

- [ ] **Step 7: Commit**

```bash
git add data functions src tests
git commit -m "feat: mode-keyed stripe price ids"
```

---

### Task 10: Lift the seven guards

**Files:**
- Modify: `functions/create-checkout-session.js:26,57`, `functions/get-checkout-session.js:11`, `functions/stripe-webhook.js:487,644`, `scripts/sync-stripe-prices.js:18`

**Interfaces:**
- Consumes: `priceIdFor` from Task 9
- Produces: a checkout that accepts live keys

**Lift all of these together.** A partial lift is the worst outcome available: live keys accepted at checkout while the webhook still rejects `livemode`, meaning cards are charged and no Printful draft is ever created. Money taken, nothing shipped.

| # | File:line | Change |
|---|---|---|
| 1 | `create-checkout-session.js:26` | delete the `secretMode !== 'test'` throw; keep the modes-must-match check |
| 2 | `create-checkout-session.js:57` | require the access header only when `mode === 'test'` |
| 3 | `printful-orders.js:293` | **leave as is** — `confirm=false` is the chosen posture |
| 4 | `sync-stripe-prices.js:18` | allow `sk_live_`/`rk_live_` only when `--live` is passed |
| 5 | `stripe-webhook.js:644` | accept live and test secrets |
| 6 | `stripe-webhook.js:487` | assert `livemode` matches the session's recorded `vf_livemode` rather than requiring `false` |
| 7 | `get-checkout-session.js:11` | accept live and test secrets |

- [ ] **Step 1: Write failing tests for live mode**

For each guard, add a test asserting the live-key path now succeeds and that mode mismatch is still rejected. The existing `tests/environment.test.js` and `tests/stripe-webhook.test.js` already cover the test-mode path — extend rather than replace them, and keep every existing assertion.

- [ ] **Step 2: Run to verify they fail**

Run: `npm test`
Expected: the new live-mode tests fail; all pre-existing tests still pass

- [ ] **Step 3: Apply the six changes**

Guard 2 becomes conditional:

```js
if (mode === 'test' && !matchesTestAccess(headerValue(event.headers, 'x-vertiflow-test-access'), testAccessSha256)) {
  return response(403, { error: 'Test checkout access denied' });
}
```

Guard 4 gains an explicit opt-in so a live sync can never happen by accident:

```js
function assertSafeStripeKey(secretKey, allowLive) {
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY is required');
  const isTest = secretKey.startsWith('sk_test_') || secretKey.startsWith('rk_test_');
  const isLive = secretKey.startsWith('sk_live_') || secretKey.startsWith('rk_live_');
  if (isTest) return 'test';
  if (isLive && allowLive) return 'live';
  throw new Error('Live price reconciliation requires the --live flag');
}
```

- [ ] **Step 4: Verify**

Run: `npm test`
Expected: everything passes, live and test paths both covered

- [ ] **Step 5: Commit**

```bash
git add functions scripts tests
git commit -m "feat: accept live stripe keys across checkout and fulfilment"
```

---

### Task 11: Create live prices and go live

**Files:**
- Modify: `data/products.json` (populates the `live` price IDs)

**Interfaces:**
- Consumes: Tasks 9 and 10

This spends real money and writes to a live Stripe account. Do it deliberately, and only after Task 8's rehearsal came back clean.

- [ ] **Step 1: Create the 107 live prices**

```bash
STRIPE_SECRET_KEY="<live key>" node scripts/sync-stripe-prices.js --live
```

- [ ] **Step 2: Review the diff before committing**

```bash
git diff --stat data/products.json
```

Expected: 107 variants gain a `live` price ID, and no `test` value changes. If any `test` value moved, stop — the script has overwritten rather than added.

- [ ] **Step 3: Commit the catalogue**

```bash
git add data/products.json
git commit -m "feat: live stripe prices for all 107 variants"
```

- [ ] **Step 4: Register the live webhook endpoint**

In the Stripe dashboard, live mode, add `https://vertiflow.fr/api/stripe/webhook` subscribed to `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Set the resulting signing secret:

```bash
netlify env:set STRIPE_WEBHOOK_SECRET "<whsec_live>" --context production
```

- [ ] **Step 5: Swap production to live keys**

```bash
netlify env:set STRIPE_SECRET_KEY "<sk_live>" --context production
netlify env:set STRIPE_PUBLISHABLE_KEY "<pk_live>" --context production
netlify env:set STRIPE_SHIPPING_RATE_ID "<live shipping rate>" --context production
```

The shipping rate must be created in live mode; a test-mode rate ID does not resolve against live keys.

- [ ] **Step 6: Deploy**

```bash
netlify deploy --build --prod
```

- [ ] **Step 7: Buy something with a real card**

Order one item. Then verify, in order: the charge appears in live Stripe; the webhook delivered 200; a Printful draft exists; the customer email arrived; the owner email arrived.

- [ ] **Step 8: Refund it and delete the draft**

Refund in Stripe, delete the Printful draft. The draft must not be confirmed — nothing should actually print.

- [ ] **Step 9: Clean up stale variables**

```bash
netlify env:unset EMAILJS_TEMPLATE_ID
netlify env:unset EMAILJS_USER_ID
netlify env:unset STRIPE_SECRET_TEST_KEY
```

Nothing in the current source reads these. Do this last, once everything above is verified.

- [ ] **Step 10: Final check**

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://vertiflow.fr/boutique
curl -s https://vertiflow.fr | grep -o '<title>[^<]*</title>'
```

Expected: 200, and the new title. The store is live. Post.

---

## Self-Review

**Spec coverage.** Route map → Tasks 3–7. Catalogue schema → Task 9. Cart → Task 2. Checkout → Task 5. The six guards plus the seventh found in `get-checkout-session.js` → Task 10. Content pages → Task 6 covers the four legally required ones; `/commencer`, FAQ, guide des tailles, contact, à propos and the journal are explicitly deferred to the follow-up plan per the resequenced spec. Deployment → Tasks 8 and 11. Error handling → Task 5's error state and Task 10's guard conditions; the Printful retryable/permanent classification is untouched existing code.

**Placeholders.** None. Task 6 carries no legal body text because it must be migrated verbatim from named source files rather than authored — the source path for each is specified.

**Type consistency.** `CartLine` is `{slug, color, size, quantity}` in Task 2 and used unchanged in Tasks 3, 4 and 5. `priceIdFor(variant, mode)` has one signature across Tasks 9 and 10. The checkout payload `{items, customer, promoCode}` matches what `create-checkout-session.js` parses. Cart lines are posted directly as `items`, and `resolveCart` expects `{slug, color, size, quantity}` — these agree.

**Known gap for the executor.** Task 5's `stripe.initCheckout` call follows the pattern in `public/checkout.html:372`, which loads Stripe.js from the `clover` channel via CDN. The `@stripe/stripe-js` npm types may name this differently. If `initCheckout` is missing from the typings, check the installed version's exports before changing approach — the backend's `ui_mode: 'elements'` is what dictates this flow, and switching to `ui_mode: 'hosted'` would be a spec change requiring Maxime's sign-off.
