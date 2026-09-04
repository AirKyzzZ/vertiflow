# Email setup — VertiFlow order pipeline

Two files here are HTML email templates, pasted by hand into the EmailJS dashboard
(EmailJS templates live in their UI, not in this repo, so there is nothing to deploy).
Two more are rendered previews with sample data, kept for reference.

| File | Goes into | Netlify env var that selects it |
|---|---|---|
| `customer-confirmation.html` | The **customer** template | `EMAILJS_CUSTOMER_TEMPLATE_ID` |
| `owner-notification.html` | The **owner** template | `EMAILJS_OWNER_TEMPLATE_ID` |
| `preview-customer.html` | not pasted anywhere — sample-data render, for review only | — |
| `preview-owner.html` | not pasted anywhere — sample-data render, for review only | — |

Every variable each template consumes is documented in an HTML comment at the top of
that file. Read it before pasting — it also lists which variables belong in the
template's **Settings** tab rather than its **Content** body.

## Read this first: the store cannot email or fulfil anything right now

Checked directly against the live Netlify project (`vertiflow`, project id
`35cbc8b8-a05e-4515-bdaf-e4f1732cdcde`) with `netlify env:list --context production`.
The **production** context is missing two of the eight variables
`functions/stripe-webhook.js` requires before it will even attempt to process a webhook:

- `EMAILJS_PRIVATE_KEY` — not set in production.
- `EMAILJS_CUSTOMER_TEMPLATE_ID` — not set in production.

`validateWebhookEnvironment()` checks for both, in that order, before the handler does
anything else — before Stripe signature verification, before touching Printful. On a
missing variable it throws, and `exports.handler`'s catch-all turns that into a
`500 { error: 'Webhook configuration error' }` with no other side effect. Concretely,
today, for a live customer order:

- Stripe charges the card. That part is unaffected and already works.
- The webhook handler fails before it reaches the Printful draft-creation step. **No
  Printful order gets created at all**, not just no emails.
- Stripe will retry the webhook on its normal schedule, but every retry fails the same
  way, because the environment doesn't change between retries.

This is not specific to the new templates in this folder — it is true of the webhook as
it stands right now, on `main`/production, independent of anything in this task. Fix it
by opening the Netlify UI → Site settings → Environment variables, and for both
`EMAILJS_PRIVATE_KEY` and `EMAILJS_CUSTOMER_TEMPLATE_ID`, ticking **Production** as a
deploy context (both already have values set for `deploy-preview` and `branch-deploy`,
just not `production` — this is a scoping gap, not a missing secret).

**One more thing to check while there.** `production`'s `EMAILJS_SERVICE_ID` is
`service_zulomgw`. `deploy-preview`/`branch-deploy` use a different one entirely,
`service_tc7twna`. These are two separate EmailJS services (each maps to its own "From"
address and its own template library — see the `Company Settings > Email Services` list
in the EmailJS dashboard). **Paste the templates in this folder into the templates that
belong to `service_zulomgw`** — pasting into a template that belongs to the preview
service will look right in a test send from the dashboard but do nothing for real
customers. Also worth noting: in `deploy-preview`/`branch-deploy`,
`EMAILJS_CUSTOMER_TEMPLATE_ID` and `EMAILJS_OWNER_TEMPLATE_ID` currently point at the
exact same template id (`template_22lvzgl`) — so even a deploy-preview test send has
never actually exercised two distinct templates yet. That's fine once this folder's two
files are in two distinct templates; flagging it so it isn't mistaken for a second bug.

## Step by step

1. Log into the EmailJS dashboard on the account tied to `service_zulomgw` (production).
2. Open (or create) the template whose id matches production's `EMAILJS_OWNER_TEMPLATE_ID`
   — currently `template_22lvzgl`. Open its **Content** tab, select all, delete, and
   paste in the full contents of `owner-notification.html` (the `<!doctype html>` line
   through the closing `</html>`, not the leading comment — the comment is documentation,
   harmless either way, but there's no reason to keep it in EmailJS's editor).
3. In that same template's **Settings** tab, set:
   - **To Email**: `{{to_email}}`
   - **Reply To**: `{{reply_to}}`
   - **Subject**: `{{subject}}`
4. Create (or open) a second template for the customer confirmation. Note its template
   id — this is the value that needs to go into `EMAILJS_CUSTOMER_TEMPLATE_ID` in
   Netlify's **production** context (see above; it's currently unset there). Paste in the
   full contents of `customer-confirmation.html`, same way as step 2.
5. Same Settings-tab mapping as step 3: **To Email** `{{to_email}}`, **Reply To**
   `{{reply_to}}`, **Subject** `{{subject}}`.
6. In Netlify: set `EMAILJS_CUSTOMER_TEMPLATE_ID` to the id from step 4, and tick
   **Production** on both that variable and `EMAILJS_PRIVATE_KEY`. Trigger a new deploy
   (env var changes don't apply to already-running functions).

## After pasting, check

- **Send yourself a test** from the EmailJS dashboard's built-in test-send, with the
  sample values below, for both templates.
- **Images load.** Every image tag is an absolute `https://vertiflow.fr/...` URL — open
  the test email on a connection that isn't on this machine's network and confirm the
  logo and the three sample product thumbnails actually load (EmailJS's own preview pane
  can be misleading here; a real inbox is the real test).
- **No literal `{{...}}` text is visible anywhere in the rendered email.** If you see one,
  the variable name in the template doesn't match what `functions/lib/emailjs.js` sends
  — check the comment block at the top of the file against
  `.superpowers/sdd/2026-08-22-vertiflow-storefront-monday/email-pipeline-report.md`'s
  variable-contract section before assuming it's a typo you can just fix in the dashboard.
- **The accents render correctly** (é, è, à, €, —). Both files declare
  `<meta charset="utf-8">` up top specifically so this works — if EmailJS's paste strips
  or mangles that tag, accents will come back as garbage (`Ã©` instead of `é`) and the
  meta tag needs restoring.
- **The owner email's button actually points at Printful** — click "Confirmer sur
  Printful" in the test send and confirm it lands on the right dashboard order page.
- **Mobile check.** Open the test send on a phone. Both templates are single-column by
  design specifically so they don't need a `<style>`/media-query block (see
  "Why no `<style>` block" below), but it's worth a look regardless.
- Send one real end-to-end test order (a real Stripe test-mode checkout, if the test-mode
  path is still reachable, or coordinate a real low-value live order) once both env vars
  are set, and confirm both emails actually land, not just the dashboard test-send.

## Why no `<style>` block, no external CSS, no flexbox/grid

This was a hard constraint on the brief, and it's also just correct for email: Outlook
(desktop, Word-based rendering engine) ignores most CSS in a `<style>` block and ignores
flexbox/grid entirely; Gmail strips `<style>` blocks in some contexts. Every rule in both
files is an inline `style="..."` attribute, and layout is plain nested `<table>`s with
`cellpadding`/`cellspacing`/`width` attributes — the one layout approach that survives
essentially every email client built since 2003. The trade-off is no responsive
media-query reflow; both templates are single-column already, so on a phone the client's
own auto-shrink handles it reasonably rather than needing one.

Both files also set `<meta name="color-scheme" content="light">` and
`<meta name="supported-color-schemes" content="light">`. That's the practical way to be
"dark-mode-safe" for a client-authored HTML email: it tells Gmail/Outlook/Apple Mail not
to auto-invert the brand's ink-on-paper palette into something undesigned. Every text
color and every background color is also set explicitly (never relying on an inherited or
default color), so that even a client that ignores those two meta tags still has an
explicit, readable color pair everywhere rather than white-on-white or black-on-black.

## Sample data used for the previews

`preview-customer.html` / `preview-owner.html` were generated by calling the real
`EmailJsClient.sendCustomerConfirmation` / `sendOwnerReview` methods with a stub `fetch`
that captures the exact `template_params` payload, then substituting those into the two
template files — the same code path production uses, not hand-typed values. Sample order:
Camille Dubreuil, La Teste-de-Buch, one T-shirt CLIMB + one Hoodie VF Definition + one
Casquette VF, total 129,96 €. Screenshots of both, rendered at a genuine 600px viewport,
are in the main report.

## The sending address

Both templates currently send from whatever "From" identity is configured on the EmailJS
**service** (`service_zulomgw` in production), which today resolves to
`vertiflow.pro@gmail.com` (`functions/lib/emailjs.js:2`, `OWNER_EMAIL`, also used as the
`reply_to` and `to_email` for the owner send). This was not changed as part of this task
— see the main report for the full assessment of what moving to an address like
`commandes@vertiflow.fr` would require (domain verification, SPF/DKIM, a new EmailJS
service). That's a DNS-touching decision reserved for Maxime.
