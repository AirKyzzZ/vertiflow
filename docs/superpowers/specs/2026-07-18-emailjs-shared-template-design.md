# EmailJS Shared VertiFlow Template Design

## Goal

Send the approved customer confirmation and the owner fulfillment-review email through the single EmailJS template available to VertiFlow on the current free plan.

## Design

The existing `Commande VertiFlow` EmailJS template becomes a generic delivery shell. EmailJS owns only the transport fields: `{{to_email}}`, `{{subject}}`, `{{message}}`, and `{{reply_to}}`. The Netlify function continues to construct all customer and order content on the server.

Both `EMAILJS_CUSTOMER_TEMPLATE_ID` and `EMAILJS_OWNER_TEMPLATE_ID` reference the existing VertiFlow template. The unrelated `Contact Klyx` template is not changed.

The customer message keeps the exact approved French copy and uses the subject `Confirmation de votre commande VertiFlow`. The owner message uses the subject `Commande VertiFlow à confirmer` for a prepared draft and `Commande VertiFlow en échec` for a permanent failure. Its plain-text body includes the customer, Stripe identifiers, Printful identifiers and dashboard URL, amount, shipping details, canonical order lines, and bounded failure details.

## Safety and failure handling

- Recipient, subject, and body are server-generated; the browser cannot choose email content.
- EmailJS remains authenticated with both public and private keys.
- Existing send serialization and retry behavior remains unchanged.
- No customer message is sent for a permanent fulfillment failure.
- The Klyx template and service are left untouched.
- Production fulfillment remains disabled until the controlled test path passes and live catalogue promotion is explicitly approved.

## Verification

Focused EmailJS tests assert the exact customer subject and body, the complete owner review body for success and failure, and the shared-template-compatible parameter contract. The full commerce suite must pass before deployment. A controlled Stripe test payment must create only an unconfirmed Printful draft and must send both emails before any live promotion.
