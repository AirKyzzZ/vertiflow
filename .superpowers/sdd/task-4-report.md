# Task 4: Wire the storefront to Stripe Custom Checkout

## Implementation

- Replaced duplicated numeric product identifiers with the nine reviewed catalogue slugs.
- Cart entries now retain `displayPrice` for presentation only; the checkout request sends only slug, color, size, and quantity.
- Replaced the active browser PaymentIntent, hard-coded key, and browser email path with Stripe Clover Custom Checkout using the server-returned publishable key and Checkout Session client secret.
- Added split name fields, ISO country values (`GB`, not `UK`), a conditional region field for US, CA, and AU, and visible French checkout errors.
- The cart remains in local storage until `success.html` receives a `session_id` prefixed with `cs_`.

## TDD evidence

1. RED: `node --test tests/storefront-checkout.test.js` failed on numeric product IDs, the legacy PaymentIntent/EmailJS/live-key flow, the `price` cart field, and the missing Checkout Session return guard.
2. GREEN: after wiring the catalogue slugs, custom Checkout request, display-only cart pricing, and success guard, the same suite passed 4/4.

## Verification

- `node --test tests/storefront-checkout.test.js` — 4 passed.
- `npm test` — 45 passed.
- `node --check public/js/custom.js` — passed.
- `git diff --check` — passed.

## Browser smoke status

Not run. The worktree has only an untracked `.env.example`; it does not supply the required test-mode Checkout configuration (`STRIPE_PUBLISHABLE_KEY` and `STRIPE_SHIPPING_RATE_ID` are absent). Per the task boundary, Netlify Dev was not started with live or incomplete configuration.

## Self-review and concerns

- No browser amount or Stripe Price ID is sent; server-side catalogue resolution remains authoritative.
- The legacy checkout source was subsequently deleted during review remediation; only the Custom Checkout path remains.

## Review fixes

- Product pages now expose only active `data/products.json` options: the cap uses `One size`, and every iPhone case model uses the exact catalogue label.
- Added a regression test that compares each page's colors and sizes with its authoritative active catalogue variants.
- Deleted the legacy checkout script entirely. Cart rows are now built with DOM nodes, `textContent`, and `setAttribute` rather than HTML interpolation.
- The checkout form uses explicit `ready`, `initializing`, `mounted`, and `recovery` states. It prevents duplicate session creation and remounting, restores the form only before a mount attempt, and asks the user to reload after a mount or action-load failure.
- The displayed payment amount is Stripe Custom Checkout's `session.total.total.amount` directly, without client-side cent conversion.
- A successful session response stores its exact session ID. The success page clears the cart and confirms payment only when the return URL matches that stored value exactly; mismatches preserve the cart and show a neutral confirmation state.
- Legacy numeric-ID or price-only carts are cleared with a visible French re-add-to-cart message.

### Review-fix verification

- `node --test tests/storefront-checkout.test.js` — 5 passed.
- `npm test` — 46 passed.
- Checkout inline-script syntax validation with `new Function(...)` — passed.
- `node --check public/js/custom.js` — passed.
- `git diff --check` — passed.

### Remaining concern

- No browser smoke test was run because the worktree still has no safe, complete test-mode Checkout environment. No Stripe, Netlify, Printful, or order mutation was attempted.

## Session verification follow-up

- Added a test-only, injected Checkout Session status endpoint that accepts only a bounded `cs_` identifier and returns only `status` and `paymentStatus`.
- The success page now confirms the exact pending session through that endpoint before clearing its cart marker; unpaid, open, cancelled, mismatched, and network-failure returns preserve the cart.
- The pay button starts disabled with a loading label, subscribes before action loading, seeds state through `actions.getSession()`, and enables only when Checkout reports `canConfirm`.
- Verification: focused endpoint/storefront tests passed 9/9; full suite passed 50/50; syntax and diff checks passed.

## Paid-order confirmation follow-up

- Physical-goods success now requires exactly `status: complete` and `paymentStatus: paid` before clearing the cart or pending marker.
- `no_payment_required` and every other result remain non-confirmed and preserve the cart.
- Verification: focused tests passed 10/10; full suite passed 51/51; endpoint syntax and diff checks passed.
