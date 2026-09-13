# Automation audit — VertiFlow

Read-only audit. No code was changed, nothing was committed or deleted. Covers the
untracked `automation/` folder and, as requested, the tracked commerce pipeline in
`functions/` that it would potentially overlap with.

## Security verdict — no plaintext credentials found

Checked `automation/` (all 4 files), the whole tracked repo (`git grep` for
`sk_/pk_/whsec_/AIza/eyJhbGci`-shaped strings), and confirmed `.env` is `.gitignore`d
(`.gitignore:66`) and not tracked (`git ls-files` has no entry for it).

**Result: clean.** `automation/` contains only placeholder tokens the guides tell you to
go fetch yourself (`YOUR_APP_ID`, `YOUR_TOKEN`, `YOUR_FILE_ID_HERE`, etc.) and n8n
credential *references* (`"id": "google-sheets-oauth"`, `"id": "openai-api"`,
`"id": "instagram-token"`) — these are just labels pointing at credentials n8n would
store in its own encrypted store; the JSON export format never contains secret values.
No API key, token, or password is committed or present in plaintext anywhere in this
repo, tracked or untracked.

---

## 1. What's in `automation/`

```
automation/SETUP.md                     (English how-to)
automation/IMPLEMENTATION-GUIDE.md      (same how-to, French, more detailed)
automation/n8n-instagram-workflow.json  (the actual n8n workflow)
automation/content-calendar-template.csv
```

All four files were written in a single ~11-minute window (filesystem mtimes
10:51–11:03) and have never been touched since. `git log --all --diff-filter=A --
automation` returns nothing — this was never committed on any branch, ever, and it is
not `.gitignore`d either; it's just sitting there untracked. This matches, verbatim, how
it's described in Maxime's own venture notes (see §2).

### What the workflow does, step by step

`n8n-instagram-workflow.json` defines a workflow named **"VertiFlow Instagram Daily
Publisher"**, one scheduled trigger firing daily at 10:00 (Europe/Paris, per the setup
docs), then:

1. **Get All Content** — reads every row of a Google Sheet ("Content Calendar")
2. **Filter Today's Pending** — keeps rows where `Date == today` and `Status == pending`
3. **Has Content?** — IF node, only the true branch is wired (see bug below)
4. **Download Image** — pulls the file from Google Drive by ID (parsed out of the
   `Image_URL` column with a regex)
5. **Generate Caption** — OpenAI (`gpt-4o-mini`) generates a French caption + hashtags,
   with two different prompts depending on `Type` (`product` vs everything else)
6. **Parse Caption** — a Code node that regex-extracts JSON out of the model's reply
7. **Create Media Container** — `POST graph.facebook.com/v19.0/{ig-user-id}/media`
8. **Wait 10s**
9. **Publish to Instagram** — `POST .../media_publish`
10. **Update Sheet - Published** — writes `Status`, `Caption`, `Hashtags`,
    `Published_At`, `Instagram_Post_ID` back to the sheet

### External services and credentials it would need

Facebook/Instagram Graph API (long-lived access token, ~60-day expiry), Google Sheets
OAuth2, Google Drive OAuth2, OpenAI API key. All four are referenced only by
placeholder credential names in the JSON; none are configured or present anywhere.

### Verdict per item

| File | Verdict |
|---|---|
| `n8n-instagram-workflow.json` | **Broken / never run.** Real bugs below, not just "untested." |
| `SETUP.md`, `IMPLEMENTATION-GUIDE.md` | **Draft, superseded.** Well-written setup docs for an approach the project has since explicitly rejected (§2). |
| `content-calendar-template.csv` | Harmless template, no bugs, moot if the workflow isn't used. |

### Concrete bugs found in the workflow JSON

This is not just "nobody finished wiring it up" — it would not have worked even if
someone had finished wiring it up:

- **The publish step is architecturally broken.** `Create Media Container` builds the
  Graph API `image_url` parameter as `'data:image/jpeg;base64,' + <downloaded
  bytes>.toString('base64')`. Instagram's `/media` endpoint requires `image_url` to be a
  publicly fetchable HTTP(S) URL — its servers fetch it themselves. A `data:` URI has no
  host to fetch and, for a real photo, would be hundreds of KB to a few MB inflated by
  base64, blown up further as a query-string parameter — nowhere near any practical URL
  length limit. This call fails every time, on the very first real post. The `Download
  Image` step exists for no working purpose. The fallback (`$json.Image_URL`, a Google
  Drive `.../view` link) wouldn't work either — that URL serves an HTML viewer page, not
  raw image bytes.
- **The advertised error handling doesn't exist.** The workflow's own sticky note says
  "If posting fails, the workflow updates the sheet with Status: `failed`..." but the
  `Update Sheet - Failed` node is never wired into the graph — it's absent from every
  entry in the `connections` object, so nothing ever feeds it. Combined with the HTTP
  Request nodes having no `continueOnFail`/error-output configured, a failure just fails
  the whole n8n execution; the sheet is never updated with `failed`/`Error_Message`.
- **Env var access is inconsistent with n8n's own docs.** `SETUP.md` and
  `IMPLEMENTATION-GUIDE.md` tell you to set `GOOGLE_SHEETS_DOC_ID` and
  `INSTAGRAM_BUSINESS_ACCOUNT_ID` under n8n's **Settings → Variables**, but the workflow
  reads them as `$env.GOOGLE_SHEETS_DOC_ID` / `$env.INSTAGRAM_BUSINESS_ACCOUNT_ID`.
  n8n's instance Variables are conventionally read via `$vars.*`; `$env.*` reads actual
  OS process environment variables (and recent n8n versions block `$env` in expressions
  by default for security). Worth re-verifying against whatever n8n version is actually
  targeted, but as written this looks like it would silently resolve to nothing.
- **Multi-post-same-day would misfire.** `Parse Caption`'s Code node pins its "original
  item" lookup to `$('Filter Today\'s Pending').first().json` regardless of which item
  in the batch is currently flowing through. If two rows are scheduled for the same
  date, every branch uses the first row's data. Minor in practice since the sample
  calendar always uses distinct dates, but it's a latent bug, not a design choice.

None of this is fatal-to-fix-someday stuff; it's evidence the file was authored in one
sitting and never executed against a live n8n instance — consistent with the fabricated
placeholder credential IDs (real n8n credential IDs aren't human-readable slugs like
`"google-sheets-oauth"`) and the JSON's internal `updatedAt`/tag timestamps
(`2025-01-21`), which don't even match the year the files were actually created on disk
(January 2026).

### Is an n8n instance configured anywhere?

No. `find` across the whole repo for `docker-compose*`, `.n8n`, or `n8n*` turns up
nothing but this one JSON file — no compose file, no `.n8n` data directory, no host or
port reference outside the setup docs' own `docker run` instructions. For completeness:
there **is** a sibling directory one level up
(`Projets-perso/n8n`) that's a plain clone of the upstream
`n8n-io/n8n` monorepo (`origin` → `github.com/n8n-io/n8n.git`, `master`, "working tree
clean", zero local commits). It's outside this repo entirely, it's vanilla upstream
source with nothing configured, and it doesn't change the answer: nothing runs n8n
anywhere right now.

### Overlap with `functions/`? None.

`automation/` only ever talks to Facebook/Instagram, Google Sheets, Google Drive, and
OpenAI. It contains zero references to Stripe, Printful, or EmailJS, and none of the
commerce pipeline's logic is duplicated. The two live in completely different domains
(marketing content posting vs. order fulfillment) and never touch the same code or
data. Nothing here needs to be reconciled against `functions/`.

---

## 2. Should `automation/` be committed, deleted, or left alone?

Three independent signals, all pointing the same direction:

1. **The project's own tracked design doc already rejected this exact approach.**
   `docs/superpowers/specs/2026-07-27-vertiflow-brand-refresh-design.md:410-415`,
   decided and dated 2026-08-08:

   > "The Instagram Graph API is deliberately not used. It saves roughly ten minutes a
   > month and buys a permanent maintenance surface: Business account, Facebook page,
   > developer app, app review, and long-lived tokens expiring every ~60 days... The
   > Graph API path in `automation/SETUP.md` stays shelved until the account justifies
   > the maintenance."

   It names `automation/SETUP.md` explicitly and prescribes a different, already-decided
   design instead: "agent drafts → human approves → Meta Business Suite schedules."
   Per that doc's own schedule table, this whole area ("content engine") is scoped for
   **after launch**, i.e., not current work regardless of mechanism.

2. **There's already a standing written instruction not to touch it.**
   `docs/superpowers/plans/2026-07-17-vertiflow-commerce-pipeline.md:24-25`:

   > "Automatic Printful confirmation, Instagram automation, PKBA products, and a new
   > email provider are out of scope... Do not stage or modify `.DS_Store`,
   > `public/.DS_Store`, or `automation/`."

3. **Maxime's own venture note flags it as unplanned scope creep.** VertiFlow is
   recorded there as frozen ("Revisit in 2027 only if injury/focus conditions change"),
   and this exact folder is called out by name as "exactly the drift the freeze was
   meant to prevent" — a restart being scoped quietly, without being written down or
   committed to.

**Recommendation:** don't commit it as-is — committing it would check a superseded
design into a repo whose own tracked spec explicitly disclaims that design, under a name
(`automation/`) that reads as "the plan" to anyone who finds it later. Leaving it
untracked and exactly where it is technically satisfies the existing "do not stage or
modify" instruction, so that alone isn't wrong. But given it's broken as written, already
superseded by a decided alternative, and flagged as drift against an active freeze
decision, deleting it (or moving the two write-ups somewhere clearly archival, outside
the repo root, if the research is worth keeping for whenever the content-engine work
actually starts) is the cleaner outcome. Either way, this is Maxime's call, not a call
this audit makes for him — per his own vault: *"Decision needed: honour the freeze, or
un-freeze it deliberately. Not this quiet middle thing."*

---

## 3. The current working order pipeline, end to end

This part is real, tracked, and passes its test suite (`npm test` → **198/198 passing**,
verified while writing this audit). It runs **test-mode only** right now — not a gap,
a deliberate gate ahead of a separate, not-yet-done go-live workstream:

- `functions/stripe-webhook.js:643-645` refuses to construct a handler unless
  `STRIPE_SECRET_KEY` matches `^(?:sk|rk)_test_`.
- `functions/create-checkout-session.js:25` throws `'Live Stripe keys require a live
  catalogue'` unless the secret key is in test mode.
- `functions/create-checkout-session.js:55-57` additionally requires every checkout
  request to carry an `x-vertiflow-test-access` header matching a server-held
  `VERTIFLOW_TEST_ACCESS_TOKEN` (hashed and compared with `crypto.timingSafeEqual` in
  `functions/lib/checkout-provenance.js:89-98`) — the storefront isn't reachable by the
  general public yet, only by whoever holds that token.

The project's own commerce spec (`docs/superpowers/specs/2026-07-27-...design.md:250-251`)
summarizes it the same way: *"The order path is already automated end to end — catalogue
sync → checkout → webhook → Printful draft → customer and owner emails."* Walking that
end to end, with line references:

1. **Customer submits cart + address.** `create-checkout-session.js` validates the cart
   against the live catalogue (`functions/lib/catalogue.js:resolveCart`, rejects unknown
   slug/color/size combos and inactive variants) and the customer's address
   (`validateCustomer`, ISO country check, state required for US/CA/AU, Brazil rejected
   outright pending tax-number support).
2. **Stripe Checkout Session created** in embedded Elements mode
   (`create-checkout-session.js:62-83`), `mode: 'payment'`. Metadata is stamped onto the
   session with a **provenance digest**: `checkoutMetadata()`
   (`functions/lib/checkout-provenance.js:100-108`) sha256-hashes the sorted, canonical
   tuple of every line (price id, product id, currency, unit amount, slug, Printful sync
   product/variant/catalog ids, quantity) into `vf_checkout_sha256`, alongside
   `vf_checkout_version`, `vf_line_count`, `vf_livemode`. This digest is what the webhook
   re-checks later — the server never trusts whatever Stripe's line items say at webhook
   time without matching them back to this hash.
3. **Customer pays** through Stripe's embedded Elements UI on-site.
4. **Stripe fires a webhook** — `checkout.session.completed` or
   `.async_payment_succeeded` (`stripe-webhook.js:12-15`); everything else is
   acknowledged and ignored (`:459-461`). Signature is verified
   (`stripe.webhooks.constructEvent`, `:452-454`) before anything else happens.
5. **Guards, in order** (`:479-497`): re-fetch the session from Stripe directly (never
   trust the webhook payload's embedded object), require `payment_status === 'paid'`,
   require `livemode === false` **and** `metadata.vf_test_access === '1'` (the test-mode
   gate above), and skip if this session was already permanently failed and reported.
6. **Provenance re-verification** (`:499-508`): pulls every line item straight from
   Stripe (`listAllLineItems`, paginated, capped at 100 lines), and
   `mapCanonicalLines` (`:203-278`) rebuilds the same canonical tuples from Stripe's own
   Price/Product objects and metadata, checks livemode on both, then re-hashes and
   compares against `vf_checkout_sha256` with `matchesCheckoutDigest`
   (`checkout-provenance.js:73-82`, `crypto.timingSafeEqual`). Any mismatch anywhere —
   wrong price, wrong product, tampered quantity, wrong mode — throws a
   `PermanentOrderError('catalogue_mismatch', ...)`, never a retry.
7. **Printful draft, idempotently** (`:510-576`). The Printful `external_id` is
   deterministic: `derivePrintfulExternalId` (`:37-43`) is a sha256 of the Checkout
   Session ID, so retries of the same session always target the same Printful order.
   If a `printful_draft_id` is already checkpointed in session metadata, it's reused
   as-is (no second Printful call). Otherwise:
   `printful.createOrGetDraft()` → `functions/lib/printful-orders.js:285-308` →
   **`POST /orders?confirm=false&update_existing=true`** (`:293`) — confirmed still
   `confirm=false`, i.e. every order lands in Printful as an unconfirmed draft, nothing
   ships automatically. If Printful reports a duplicate (`409`, or `400` with
   `OR-13`/`EXTERNAL_ID_IN_USE`), the client fetches the existing draft instead of
   erroring (`:302-305`), and `validateDraft` (`:139-181`) cross-checks the returned
   draft's recipient/items against what was actually expected before accepting it. Once
   created, the session is checkpointed with `printful_external_id`, `printful_draft_id`,
   `fulfillment_status: 'awaiting_owner_confirmation'` (`:571-576`).
8. **Two emails, each individually checkpointed** (`:588-600`): customer confirmation
   first, then owner review — each gated on its own `*_email_sent` metadata flag, so a
   retry after a partial failure only re-sends whichever one didn't go out yet.
9. **Response**: `200 { received: true }` on success. On any thrown error: if it's a
   `PermanentOrderError` (bad provenance, bad shipping address, Printful outright
   rejecting/mismatching the draft), `reportPermanentFailure` (`:411-428`) checkpoints
   `fulfillment_status: 'permanent_failure'`, emails the owner the failure details
   (including side-by-side expected-vs-actual line items for a Printful mismatch), then
   checkpoints `fulfillment_failure_reported: 'true'` so it's never re-alerted — still
   returns `200` so Stripe stops retrying a failure that a retry can't fix. Anything else
   (network blips, Stripe/Printful/EmailJS transient errors) returns `500`, which makes
   Stripe redeliver the webhook later; the checkpointing above means a redelivery resumes
   from wherever it left off instead of double-creating an order or double-emailing.

**What's still manual today:** nothing auto-confirms the Printful draft. `confirm=false`
is a deliberate decision — quoting the project's own spec
(`docs/superpowers/specs/2026-07-27-...design.md:254-264`): *"The webhook creates drafts
with `confirm: false` so nothing reaches production unreviewed... Decided 2026-08-08: the
24h veto window is the design. Not zero-touch."* — but the 24h-auto-confirm-unless-vetoed
mechanism that decision describes is **not implemented anywhere in this codebase**: no
scheduled function, no cron, nothing in `netlify.toml`. It's explicitly listed as
post-launch work in that same doc's schedule table ("after launch: `/admin` · Printful
auto-confirm..."). Right now, every order requires Maxime to manually open the Printful
dashboard and confirm it — indefinitely, with no timer and no expiry.

### EmailJS templates and variables (`functions/lib/emailjs.js`)

Two configured templates, `EMAILJS_CUSTOMER_TEMPLATE_ID` and `EMAILJS_OWNER_TEMPLATE_ID`.

- **Customer template** (`sendCustomerConfirmation`, `:342-352`) needs: `to_email`,
  `first_name`, `last_name`, `reply_to`, `subject`, `message` (a prebuilt French plain-text
  body, `:147-162`).
- **Owner template** is reused for two different situations — a prepared order awaiting
  confirmation, and a permanent failure — distinguished by `subject` and whether
  `failure` is present (`sendOwnerReview`, `:354-408`). It needs: `to_email`, `reply_to`,
  `subject`, `message`, `stripe_session_id`, `payment_intent_id`, `printful_order_id`,
  `printful_external_id`, `printful_dashboard_url`, `amount_total`, `shipping_details`,
  `order_lines`, `failure_details`, plus legacy-named duplicates (`name`, `email`,
  `address`, `total`, `cartItems`) kept for template back-compat, and, only for a
  `draft_mismatch` failure, `expected_printful_lines` / `actual_printful_lines`.

Sends are serialized through an internal queue with a hard **1.1s minimum interval**
between EmailJS calls (`MINIMUM_SEND_INTERVAL_MS`, `:7`, enforced `:294-309`) — a
deliberate throttle against EmailJS's own rate limiting, not incidental.

### Retryable vs. permanent, in one place

- **Permanent** (`PermanentOrderError`, never retried, always ends in an owner alert):
  catalogue/provenance mismatch, invalid/unsupported shipping address (including
  Brazil, and missing state for US/CA/AU), stored Printful IDs that don't match the
  session, Printful returning something other than an unconfirmed draft, Printful
  item/recipient mismatch on an existing draft.
- **Retryable** (`PrintfulOrderError.retryable === true`, from
  `printful-orders.js:183-203`): Printful HTTP 408/419/429/5xx, and network-level
  failures (timeout, `ECONNRESET`, `ECONNREFUSED`, `ENOTFOUND`, `ETIMEDOUT`, etc.) up to
  4 levels deep through `error.cause`.
- Everything uncaught/unclassified (Stripe errors, EmailJS errors, coding errors) falls
  through to the generic `500` branch, i.e. **defaults retryable** — Stripe redelivers
  the webhook per its own schedule (up to ~3 days), and the checkpointing described
  above makes that safe to replay.

## 4. What breaks if each service is down

- **Stripe down:** nobody can start checkout at all — `create-checkout-session.js`
  fails outright with a `500`. No queue, no fallback; inherent to depending on Stripe
  for payment, not a bug here. If Stripe has a blip specifically while the *webhook*
  handler is mid-flight (e.g. the `checkpoint()` metadata write fails), the deterministic
  Printful `external_id` means a Stripe-triggered retry still won't double-create the
  Printful order.
- **Printful down:** checkout still works, payment still succeeds, but draft creation
  throws a retryable `PrintfulOrderError`; the webhook returns `500` and waits for
  Stripe's redelivery. Customer and owner get nothing yet. If the outage outlasts
  Stripe's ~3-day webhook retry window, the order is never created and **nobody is
  actively notified** — see gap #2 below.
- **EmailJS down:** same shape as Printful — the Printful draft is created successfully
  (owner could still find it by checking Printful directly), but both emails fail and
  retry via Stripe redelivery. Same tail risk if the outage outlasts the retry window.

## 5. Reliability gaps worth fixing, ranked

1. **Printful confirmation has no automatic follow-through.** Every paid order sits as
   an unconfirmed Printful draft forever unless Maxime manually confirms it in the
   Printful dashboard — no timer, no expiry, no escalation. The 24h-veto auto-confirm is
   already decided as the design (`docs/superpowers/specs/2026-07-27-...design.md:258-264`)
   but not built. This is the actual bottleneck between "customer paid" and "customer
   receives goods."
2. **No independent alerting beyond Stripe's own webhook retry window.** A Printful or
   EmailJS outage longer than ~3 days (or any unexpected exception that isn't a clean
   `PermanentOrderError`) silently drops the order with no active notification — the only
   visibility is manually checking Stripe's webhook delivery logs.
3. **Single point of contact for every alert.** Both the "please confirm this order" and
   "this order permanently failed" emails go to one hardcoded inbox
   (`emailjs.js:2`, `vertiflow.pro@gmail.com`) through one provider, with no secondary
   channel. If that inbox or the EmailJS account has a problem, gap #2 gets worse
   silently.
4. **Minor: a narrow duplicate-email race.** If `sendCustomerConfirmation` (or
   `sendOwnerReview`) succeeds but the following `checkpoint()` call fails before the
   `*_email_sent` flag is persisted (`stripe-webhook.js:588-600`), a Stripe-triggered
   retry will resend that one email. Low probability, cosmetic impact (never causes a
   duplicate Printful order, since that side is protected by the deterministic
   `external_id`).

Caveat on all of the above: the 198/198 passing test suite exercises this logic against
mocked Stripe/Printful/EmailJS clients — strong evidence the *logic* is correct, not
proof that live credentials/quotas/API versions are currently working end to end against
the real services.
