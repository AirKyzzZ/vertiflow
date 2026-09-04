# Adding a product (`scripts/add-product.js`)

Interactive CLI for adding one new product to `data/products.json` without hand-editing
JSON. Prompts for the product's slug, name, price, and one or two Printful sync product
IDs (one per colour), fetches the real variants from Printful, creates the matching
Stripe product and prices in both test and live mode via the Stripe CLI, and appends the
result to the catalogue.

## Requirements

- `PRINTFUL_API_KEY` (or `PRINTFUL_TOKEN`) and `PRINTFUL_STORE_ID=15558986` in the environment.
- The `stripe` CLI installed and logged in (`stripe login`), with write access to both test and live mode.
- The Printful sync product(s) already created and synced in Printful, with print files in place.

## Run it

```
node scripts/add-product.js [slug]
```

The slug can be passed as an argument or typed at the first prompt. Everything else is
asked interactively: name, price, and for each colour a Printful sync product ID, the
public size list in order, and optional size aliases for when Printful's own size name
should not be shown to customers (e.g. `One size=M`, the same pattern already used for
`cache-cou-vf` and `bob-vf` in `data/storefront-products.json`).

The tool prints the Printful product name and the resolved variants before touching
Stripe, and asks for confirmation again before writing anything, so you can bail out at
either point without side effects.

## What it guards against

- Refuses to run if the slug already exists in `data/products.json` — idempotent, it
  never rewrites or removes an existing entry.
- Refuses if a fetched Printful product's name matches `pkba` or `kenzi`, the two
  product families that must never enter this catalogue (see `docs/commerce-catalogue.md`).
- Validates the full catalogue against `data/products.schema.json` before writing;
  aborts without writing if it doesn't pass.
- Stripe creation is idempotent: it looks up existing Stripe products/prices by
  `metadata.vf_slug` (and colour/size for prices) before creating anything, and also
  sets Stripe idempotency keys, so re-running after a crash reuses rather than
  duplicates whatever Stripe already has.
- If live-mode Stripe creation fails (a restricted key without write scopes, for
  example), the product is still written with its test-mode IDs and `live: null`.
  Re-run `scripts/create-live-stripe-catalogue.js` later to backfill the live IDs once
  permissions are fixed.

## After it runs

The tool only writes `data/products.json`. It reminds you of the rest, but does not do
it for you:

- Add copy (`lead`, `body`, `specs`) for the new slug in `src/lib/product-copy.ts`.
- Add an image array per colour for the new slug in `src/lib/product-media.ts`
  (local `/images/product/...` paths only, four images max per colour).

Both are enforced by `tests/product-copy.test.js` and `tests/product-media.test.js`,
which fail for any catalogue slug missing either.

## One thing it deliberately does not do

`data/storefront-products.json` plus `scripts/sync-printful-catalogue.js` and
`scripts/lib/printful-catalogue.js` are a separate, stricter system: a reviewed
allowlist currently locked to exactly 9 products, 15 Printful sources, and 107 active
variants (enforced in `tests/environment.test.js` and `tests/storefront-catalogue.test.js`).
That lock exists to keep unrelated Printful products — PKBA's and Kenzi's merch live in
the same Printful account — out of this storefront by accident.

`add-product.js` does not touch that allowlist and does not run its validator. It only
validates against `data/products.schema.json`, whose product-count ceiling has been
removed so the catalogue can legitimately grow past 9.

Once you use this tool for real, that means the two "exactly nine products" tests above
will start failing on purpose — they are guarding a specific, reviewed set, and adding a
product is a deliberate change to that set. Update their hardcoded counts and approved
Printful ID lists to match the catalogue you actually want once you've reviewed the
addition.
