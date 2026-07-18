# Stripe Elements UI Mode Compatibility Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore test Checkout Session creation against Stripe API version `2026-06-24.dahlia` without changing payment, catalogue, or fulfillment authority.

**Architecture:** Keep the existing Stripe Checkout Sessions plus `initCheckout` Payment Element flow. Change only the server-side Checkout Session `ui_mode` enum from the removed `custom` value to Stripe's required `elements` value and pin that provider contract in the focused test.

**Tech Stack:** Node.js 22, Stripe Node SDK, Netlify Functions, Node test runner

## Global Constraints

- Stripe Workbench request `req_OOVZFO64wZZC7j` returned `The ui_mode value custom is no longer supported. Use elements instead.` under API version `2026-06-24.dahlia`.
- Preserve server-owned prices, shipping, customer validation, provenance metadata, test-access gating, and test-only key enforcement.
- Do not change browser payment logic, webhook behavior, Printful behavior, email behavior, dependencies, or live-mode gates.

---

### Task 1: Use Stripe's current Elements UI mode

**Files:**
- Modify: `functions/create-checkout-session.js`
- Test: `tests/create-checkout-session.test.js`

**Interfaces:**
- Consumes: `stripe.checkout.sessions.create(params)`
- Produces: Checkout Session parameters with `ui_mode: 'elements'`

- [x] **Step 1: Change the focused assertion to `elements`**

Update the existing successful Checkout Session test to require `params.ui_mode === 'elements'` while leaving every other parameter assertion unchanged.

- [x] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/create-checkout-session.test.js`

Expected: the successful Session test fails because production still sends `custom`.

- [x] **Step 3: Make the minimal compatibility change**

Change the single `ui_mode` value in `functions/create-checkout-session.js` from `custom` to `elements`.

- [x] **Step 4: Run focused and full tests**

Run: `node --test tests/create-checkout-session.test.js && npm test`

Expected: focused tests pass and at least 174 total tests pass with zero failures.

- [x] **Step 5: Commit**

```bash
git add functions/create-checkout-session.js tests/create-checkout-session.test.js
git commit -m "fix: use Stripe elements UI mode"
```
