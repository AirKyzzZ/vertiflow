# EmailJS Shared VertiFlow Template Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make both VertiFlow commerce emails compatible with one generic EmailJS template without changing the approved customer copy or fulfillment safety gates.

**Architecture:** `EmailJsClient` continues to validate and serialize order data, but each send now supplies a server-generated `subject` and complete plain-text `message`. Both Netlify template ID variables point to the existing VertiFlow template configured with generic recipient, subject, body, and reply-to placeholders.

**Tech Stack:** Node.js 22, Netlify Functions, EmailJS REST API, Node test runner

## Global Constraints

- The exact approved customer message in `customerMessage()` must not change.
- Customer subject: `Confirmation de votre commande VertiFlow`.
- Prepared owner subject: `Commande VertiFlow à confirmer`.
- Permanent-failure owner subject: `Commande VertiFlow en échec`.
- The owner message must include customer identity, Stripe Session and PaymentIntent IDs, Printful order and external IDs, Printful dashboard URL, amount, shipping details, canonical order lines, and bounded failure details.
- Keep EmailJS public/private-key authentication, serialization, retry behavior, and validation unchanged.
- Do not modify the Klyx EmailJS template or introduce a dependency.
- Do not enable live Stripe or Printful fulfillment.

---

### Task 1: Produce generic-template email parameters

**Files:**
- Modify: `functions/lib/emailjs.js`
- Test: `tests/emailjs.test.js`

**Interfaces:**
- Consumes: `EmailJsClient.sendCustomerConfirmation(order)` and `EmailJsClient.sendOwnerReview(order)`
- Produces: EmailJS `template_params` containing `to_email`, `subject`, `message`, and `reply_to` for both delivery paths

- [x] **Step 1: Write the failing customer parameter test**

Update the customer assertion to require `subject: 'Confirmation de votre commande VertiFlow'` while preserving the exact existing `message` value.

- [x] **Step 2: Write the failing owner parameter tests**

Require prepared and permanent-failure sends to include their exact subjects and a complete plain-text `message` containing all fields listed in Global Constraints. Keep the existing structured aliases asserted so compatibility is not accidentally removed.

- [x] **Step 3: Run the focused tests and verify RED**

Run: `node --test tests/emailjs.test.js`

Expected: FAIL because the current customer and owner parameters do not contain the new subjects and the owner parameters do not contain a complete message.

- [x] **Step 4: Implement the minimal server-built subjects and owner message**

Add small named constants or helpers in `functions/lib/emailjs.js`. Reuse the already-normalized formatted amount, recipient, lines, Printful URL, and failure text so the generic body does not duplicate validation or expose provider responses.

- [x] **Step 5: Run the focused tests and verify GREEN**

Run: `node --test tests/emailjs.test.js`

Expected: all EmailJS tests pass with zero failures.

- [x] **Step 6: Run the complete suite**

Run: `npm test`

Expected: 174 or more tests pass with zero failures.

- [x] **Step 7: Commit**

```bash
git add functions/lib/emailjs.js tests/emailjs.test.js
git commit -m "fix: share VertiFlow email template"
```
