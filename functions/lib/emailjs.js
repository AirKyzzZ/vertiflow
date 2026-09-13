const EMAILJS_SEND_URL = 'https://api.emailjs.com/api/v1.0/email/send';
const OWNER_EMAIL = 'vertiflow.pro@gmail.com';
const CUSTOMER_EMAIL_SUBJECT = 'Confirmation de votre commande VertiFlow';
const OWNER_PREPARED_SUBJECT = 'Commande VertiFlow à confirmer';
const OWNER_FAILURE_SUBJECT = 'Commande VertiFlow en échec';
const REQUEST_TIMEOUT_MS = 15_000;
const MINIMUM_SEND_INTERVAL_MS = 1_100;
const SITE_URL = 'https://vertiflow.fr';
const GENERIC_THUMBNAIL_URL = `${SITE_URL}/images/logo-transparent.png`;
const LARGE_ORDER_AMOUNT_CENTS = 20_000;
const LARGE_ORDER_QUANTITY = 6;

const catalogue = require('../../data/products.json');
const { reviewedUnitAmount } = require('./catalogue');

const PRODUCT_THUMBNAIL_PATHS = {
  'T-shirt CLIMB': {
    Noir: '/images/product/front_tshirt.png',
    Blanc: '/images/product/front_tshirt_white.png',
  },
  'Hoodie VF Definition': {
    Noir: '/images/product/front_hoodie.png',
    Blanc: '/images/product/front_hoodie_white.png',
  },
  'Casquette VF': {
    Noir: '/images/product/front_cap.png',
    Blanc: '/images/product/front_cap_white.png',
  },
  'Shorts Performance VF': {
    Noir: '/images/product/front_shorts.png',
    Blanc: '/images/product/front_shorts_white.png',
  },
  'Coque iPhone VF': {
    Noir: '/images/product/front_case.png',
    Blanc: '/images/product/front_case_white.png',
  },
  'Débardeur VF': {
    Noir: '/images/product/front_debardeur_black.png',
    Blanc: '/images/product/front_debardeur_white.png',
  },
  'Cache-cou VF': { Noir: '/images/product/cachecou3.png' },
  'Bob VF': { Blanc: '/images/product/front_bob.png' },
  'Short Confort VF': { Blanc: '/images/product/front_short_confort.png' },
};

function catalogueUnitAmountsByName() {
  const amounts = new Map();
  const products = Array.isArray(catalogue?.products) ? catalogue.products : [];
  for (const product of products) {
    if (!product || typeof product.name !== 'string' || typeof product.price !== 'string') continue;
    let amount;
    try {
      amount = reviewedUnitAmount(product.price);
    } catch {
      continue;
    }
    amounts.set(product.name.trim(), amount);
  }
  return amounts;
}

const CATALOGUE_UNIT_AMOUNTS_BY_NAME = catalogueUnitAmountsByName();

class EmailJsError extends Error {
  constructor(message, { retryable = true, status } = {}) {
    super(message);
    this.name = 'EmailJsError';
    this.retryable = retryable;
    this.status = status;
  }
}

function invalidOrder() {
  return new EmailJsError('Invalid email order data', { retryable: false });
}

function requiredString(value, maxLength) {
  if (typeof value !== 'string') throw invalidOrder();
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) throw invalidOrder();
  return normalized;
}

function optionalString(value, maxLength) {
  if (value == null || value === '') return '';
  return requiredString(value, maxLength);
}

function validEmail(value) {
  const email = requiredString(value, 320).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw invalidOrder();
  return email;
}

function normalizeLine(line) {
  if (!line || typeof line !== 'object' || Array.isArray(line)) throw invalidOrder();
  const syncVariantId = Number(line.syncVariantId);
  if (
    !Number.isInteger(syncVariantId)
    || syncVariantId <= 0
    || !Number.isInteger(line.quantity)
    || line.quantity < 1
    || line.quantity > 10
  ) throw invalidOrder();
  return {
    name: requiredString(line.name, 200),
    color: requiredString(line.color, 100),
    size: requiredString(line.size, 100),
    quantity: line.quantity,
    syncVariantId,
  };
}

function normalizeFailure(failure) {
  if (failure == null) return null;
  if (!failure || typeof failure !== 'object' || Array.isArray(failure)) throw invalidOrder();
  const code = requiredString(failure.code, 100);
  if (!/^[a-z0-9_]+$/.test(code)) throw invalidOrder();
  const normalized = { code, details: requiredString(failure.details, 500) };
  if (code === 'draft_mismatch') {
    normalized.expectedItems = normalizeMismatchItems(failure.expectedItems, false);
    normalized.actualItems = normalizeMismatchItems(failure.actualItems, true);
  }
  return normalized;
}

function normalizeMismatchItems(items, allowEmpty) {
  if (!Array.isArray(items) || items.length > 100 || (!allowEmpty && items.length === 0)) throw invalidOrder();
  return items.map((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw invalidOrder();
    if (
      !Number.isInteger(item.sync_variant_id)
      || item.sync_variant_id <= 0
      || !Number.isInteger(item.quantity)
      || item.quantity < 1
      || item.quantity > 10
    ) throw invalidOrder();
    return { syncVariantId: item.sync_variant_id, quantity: item.quantity };
  });
}

function normalizeRecipient(recipient, failure) {
  if (recipient == null && failure) return null;
  if (!recipient || typeof recipient !== 'object' || Array.isArray(recipient)) throw invalidOrder();
  const countryCode = requiredString(recipient.country_code, 2).toUpperCase();
  if (!/^[A-Z]{2}$/.test(countryCode)) throw invalidOrder();
  return {
    name: requiredString(recipient.name, 200),
    address1: requiredString(recipient.address1, 200),
    address2: optionalString(recipient.address2, 200),
    city: requiredString(recipient.city, 200),
    zip: requiredString(recipient.zip, 50),
    country_code: countryCode,
    state_code: optionalString(recipient.state_code, 100),
    email: validEmail(recipient.email),
    phone: optionalString(recipient.phone, 50),
  };
}

function normalizePersonalInfo(order) {
  if (!order || typeof order !== 'object' || Array.isArray(order)) throw invalidOrder();
  return {
    firstName: requiredString(order.firstName, 100),
    lastName: requiredString(order.lastName, 100),
    customerEmail: validEmail(order.customerEmail),
  };
}

function normalizeAmount(order) {
  if (!Number.isInteger(order.amountTotal) || order.amountTotal < 0) throw invalidOrder();
  const currency = requiredString(order.currency, 3).toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw invalidOrder();
  return { amountTotal: order.amountTotal, currency };
}

function normalizeExternalId(value) {
  const printfulExternalId = requiredString(value, 32);
  if (!/^[A-Za-z0-9_-]{1,32}$/.test(printfulExternalId)) throw invalidOrder();
  return printfulExternalId;
}

function normalizeCustomerOrder(order) {
  const personal = normalizePersonalInfo(order);
  const lines = Array.isArray(order.lines) ? order.lines.map(normalizeLine) : null;
  if (!lines || lines.length === 0 || lines.length > 100) throw invalidOrder();
  return {
    ...personal,
    printfulExternalId: normalizeExternalId(order.printfulExternalId),
    recipient: normalizeRecipient(order.recipient, null),
    lines,
    ...normalizeAmount(order),
  };
}

function normalizeOwnerOrder(order) {
  const personal = normalizePersonalInfo(order);
  const failure = normalizeFailure(order.failure);
  const lines = Array.isArray(order.lines) ? order.lines.map(normalizeLine) : null;
  if (!lines || (lines.length === 0 && !failure) || lines.length > 100) throw invalidOrder();
  const stripeSessionId = requiredString(order.stripeSessionId, 255);
  const paymentIntentId = requiredString(order.paymentIntentId, 255);
  const printfulExternalId = normalizeExternalId(order.printfulExternalId);
  if (!/^cs_[A-Za-z0-9_]+$/.test(stripeSessionId) || !/^pi_[A-Za-z0-9_]+$/.test(paymentIntentId)) {
    throw invalidOrder();
  }
  const printfulOrderId = order.printfulOrderId == null ? null : Number(order.printfulOrderId);
  if (printfulOrderId != null && (!Number.isInteger(printfulOrderId) || printfulOrderId <= 0)) {
    throw invalidOrder();
  }
  return {
    ...personal,
    stripeSessionId,
    paymentIntentId,
    printfulOrderId,
    printfulExternalId,
    recipient: normalizeRecipient(order.recipient, failure),
    lines,
    failure,
    ...normalizeAmount(order),
  };
}

function ownerMessage({
  subject,
  firstName,
  lastName,
  customerEmail,
  stripeSessionId,
  paymentIntentId,
  printfulOrderId,
  printfulExternalId,
  printfulDashboardUrl,
  amount,
  shippingDetails,
  orderLines,
  failureDetails,
}) {
  return [
    subject,
    '',
    `Client: ${firstName} ${lastName}`,
    `Email client: ${customerEmail}`,
    `Stripe Session: ${stripeSessionId}`,
    `PaymentIntent: ${paymentIntentId}`,
    `Printful order: ${printfulOrderId}`,
    `Printful external ID: ${printfulExternalId}`,
    `Printful dashboard: ${printfulDashboardUrl}`,
    `Montant: ${amount}`,
    '',
    'Livraison:',
    shippingDetails,
    '',
    'Lignes:',
    orderLines,
    '',
    `Échec de préparation: ${failureDetails}`,
  ].join('\n');
}

function formatLines(lines) {
  if (lines.length === 0) return 'Aucune ligne canonique disponible';
  return lines.map((line) => (
    `${line.quantity} × ${line.name} — ${line.color} — ${line.size} — sync_variant_id ${line.syncVariantId}`
  )).join('\n');
}

function formatMismatchLines(lines) {
  if (lines.length === 0) return 'Aucune ligne valide retournée';
  return lines.map((line) => `${line.quantity} × sync_variant_id ${line.syncVariantId}`).join('\n');
}

function escapeHtml(value) {
  const entities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return value.replace(/[&<>"']/g, (character) => entities[character]);
}

function formatLegacyCartItems(lines) {
  if (lines.length === 0) {
    return '<tr><td>Aucune ligne canonique disponible</td><td>0</td><td>Prix unitaire non disponible</td></tr>';
  }
  return lines.map((line) => (
    `<tr><td>${escapeHtml(line.name)} — ${escapeHtml(line.color)} — ${escapeHtml(line.size)}</td>`
    + `<td>${escapeHtml(String(line.quantity))}</td><td>Prix unitaire non disponible</td></tr>`
  )).join('');
}

function formatEuroAmount(amountInCents) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amountInCents / 100);
}

function productThumbnailUrl(name, color) {
  const colorPaths = PRODUCT_THUMBNAIL_PATHS[name];
  if (!colorPaths) return GENERIC_THUMBNAIL_URL;
  const path = colorPaths[color] ?? colorPaths[Object.keys(colorPaths)[0]];
  return `${SITE_URL}${path}`;
}

function customerLineRow(line) {
  const unitAmount = CATALOGUE_UNIT_AMOUNTS_BY_NAME.get(line.name);
  const lineTotal = unitAmount == null ? '' : formatEuroAmount(unitAmount * line.quantity);
  const thumbnailUrl = productThumbnailUrl(line.name, line.color);
  const alt = escapeHtml(`${line.name} — ${line.color}`);
  return '<tr>'
    + `<td style="padding:14px 0;border-bottom:1px solid #e4e2de;width:72px;" valign="top">`
    + `<img src="${thumbnailUrl}" width="64" height="64" alt="${alt}" `
    + `style="display:block;width:64px;height:64px;border-radius:6px;object-fit:cover;background-color:#f7f4ef;" />`
    + '</td>'
    + '<td style="padding:14px 12px;border-bottom:1px solid #e4e2de;'
    + 'font-family:Arial,Helvetica,sans-serif;color:#0b0b0c;font-size:14px;line-height:1.5;" valign="top">'
    + `${escapeHtml(line.name)}<br />`
    + `<span style="color:#6e6e76;">${escapeHtml(line.color)} &middot; ${escapeHtml(line.size)} &middot; Qté ${line.quantity}</span>`
    + '</td>'
    + '<td style="padding:14px 0;border-bottom:1px solid #e4e2de;font-family:Arial,Helvetica,sans-serif;'
    + 'color:#0b0b0c;font-size:14px;text-align:right;white-space:nowrap;" valign="top">'
    + `${lineTotal}`
    + '</td>'
    + '</tr>';
}

function customerLinesHtml(lines) {
  return lines.map(customerLineRow).join('');
}

function unusualOrderFlags(normalized) {
  const flags = [];
  if (normalized.recipient && normalized.recipient.country_code !== 'FR') {
    flags.push(`Adresse hors France : livraison en ${escapeHtml(normalized.recipient.country_code)}.`);
  }
  const totalQuantity = normalized.lines.reduce((sum, line) => sum + line.quantity, 0);
  if (normalized.amountTotal >= LARGE_ORDER_AMOUNT_CENTS || totalQuantity >= LARGE_ORDER_QUANTITY) {
    flags.push('Montant ou quantité inhabituels pour une commande VertiFlow.');
  }
  return flags;
}

function unusualFlagsHtml(flags) {
  if (flags.length === 0) return '';
  const items = flags.map((flag) => `<li style="margin:0 0 4px;">${flag}</li>`).join('');
  return '<tr><td style="padding:16px;background-color:#fbe6cc;border:1px solid #e8912d;border-radius:6px;'
    + 'font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#0b0b0c;">'
    + '<strong>À vérifier avant de confirmer :</strong>'
    + `<ul style="margin:8px 0 0;padding-left:18px;">${items}</ul>`
    + '</td></tr>';
}

function mismatchDetailsHtml(failure) {
  if (!failure || failure.code !== 'draft_mismatch') return '';
  const expected = escapeHtml(formatMismatchLines(failure.expectedItems)).replace(/\n/g, '<br />');
  const actual = escapeHtml(formatMismatchLines(failure.actualItems)).replace(/\n/g, '<br />');
  return '<tr><td style="padding:16px;background-color:#fbeaea;border:1px solid #c0392b;border-radius:6px;'
    + 'font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#0b0b0c;">'
    + '<strong>Le brouillon Printful ne correspond pas à la commande payée&nbsp;:</strong>'
    + `<div style="margin-top:8px;"><strong>Attendu&nbsp;:</strong><br />${expected}</div>`
    + `<div style="margin-top:8px;"><strong>Reçu&nbsp;:</strong><br />${actual}</div>`
    + '</td></tr>';
}

function defaultSleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function formatRecipient(recipient) {
  if (!recipient) return 'Indisponible (voir erreur de préparation)';
  return [
    recipient.name,
    recipient.address1,
    recipient.address2,
    `${recipient.zip} ${recipient.city}`,
    recipient.state_code,
    recipient.country_code,
    recipient.email,
    recipient.phone,
  ].filter(Boolean).join('\n');
}

function configurationString(value, name) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 500) {
    throw new Error(`${name} is required`);
  }
  return value.trim();
}

class EmailJsClient {
  constructor({
    serviceId,
    publicKey,
    privateKey,
    customerTemplateId,
    ownerTemplateId,
    fetchImpl = globalThis.fetch,
    timeoutMs = REQUEST_TIMEOUT_MS,
    minimumSendIntervalMs = MINIMUM_SEND_INTERVAL_MS,
    now = Date.now,
    sleep = defaultSleep,
  }) {
    this.serviceId = configurationString(serviceId, 'EMAILJS_SERVICE_ID');
    this.publicKey = configurationString(publicKey, 'EMAILJS_PUBLIC_KEY');
    this.privateKey = configurationString(privateKey, 'EMAILJS_PRIVATE_KEY');
    this.customerTemplateId = configurationString(customerTemplateId, 'EMAILJS_CUSTOMER_TEMPLATE_ID');
    this.ownerTemplateId = configurationString(ownerTemplateId, 'EMAILJS_OWNER_TEMPLATE_ID');
    if (typeof fetchImpl !== 'function') throw new Error('A fetch implementation is required');
    if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60_000) throw new Error('Invalid EmailJS timeout');
    if (
      !Number.isInteger(minimumSendIntervalMs)
      || minimumSendIntervalMs < MINIMUM_SEND_INTERVAL_MS
      || minimumSendIntervalMs > 60_000
    ) throw new Error('Invalid EmailJS send interval');
    if (typeof now !== 'function' || typeof sleep !== 'function') throw new Error('Invalid EmailJS scheduler');
    this.fetch = fetchImpl;
    this.timeoutMs = timeoutMs;
    this.minimumSendIntervalMs = minimumSendIntervalMs;
    this.now = now;
    this.sleep = sleep;
    this.lastSendStartedAt = null;
    this.sendQueue = Promise.resolve();
  }

  async send(templateId, templateParams) {
    const delivery = this.sendQueue.then(async () => {
      const currentTime = this.now();
      if (!Number.isFinite(currentTime)) throw new Error('Invalid EmailJS clock');
      if (this.lastSendStartedAt !== null) {
        const waitMs = this.minimumSendIntervalMs - (currentTime - this.lastSendStartedAt);
        if (waitMs > 0) await this.sleep(waitMs);
      }
      const startedAt = this.now();
      if (!Number.isFinite(startedAt)) throw new Error('Invalid EmailJS clock');
      this.lastSendStartedAt = startedAt;
      return this.deliver(templateId, templateParams);
    });
    this.sendQueue = delivery.catch(() => undefined);
    return delivery;
  }

  async deliver(templateId, templateParams) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      let response;
      try {
        response = await this.fetch(EMAILJS_SEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: this.serviceId,
            template_id: templateId,
            user_id: this.publicKey,
            accessToken: this.privateKey,
            template_params: templateParams,
          }),
          signal: controller.signal,
        });
      } catch {
        throw new EmailJsError('EmailJS delivery failed');
      }
      if (!response || typeof response.ok !== 'boolean' || !response.ok) {
        throw new EmailJsError('EmailJS delivery failed', {
          status: Number.isInteger(response?.status) ? response.status : undefined,
        });
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  async sendCustomerConfirmation(order) {
    const normalized = normalizeCustomerOrder(order);
    await this.send(this.customerTemplateId, {
      to_email: normalized.customerEmail,
      first_name: escapeHtml(normalized.firstName),
      last_name: escapeHtml(normalized.lastName),
      reply_to: OWNER_EMAIL,
      subject: CUSTOMER_EMAIL_SUBJECT,
      preheader_text: `Commande ${normalized.printfulExternalId} confirmée, livraison estimée sous 7 à 10 jours ouvrés.`,
      order_reference: normalized.printfulExternalId,
      order_lines_html: customerLinesHtml(normalized.lines),
      order_total: formatEuroAmount(normalized.amountTotal),
      shipping_name: escapeHtml(normalized.recipient.name),
      shipping_address1: escapeHtml(normalized.recipient.address1),
      shipping_address2: normalized.recipient.address2 ? `${escapeHtml(normalized.recipient.address2)}<br />` : '',
      shipping_city: escapeHtml(normalized.recipient.city),
      shipping_zip: escapeHtml(normalized.recipient.zip),
      shipping_country: escapeHtml(normalized.recipient.country_code),
    });
  }

  async sendOwnerReview(order) {
    const normalized = normalizeOwnerOrder(order);
    const formattedAmount = new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(normalized.amountTotal / 100);
    const amount = `${formattedAmount} ${normalized.currency}`;
    const legacyTotal = (normalized.amountTotal / 100).toFixed(2);
    const shippingDetails = formatRecipient(normalized.recipient);
    const orderLines = formatLines(normalized.lines);
    const printfulOrderId = normalized.printfulOrderId == null ? 'Non créé' : String(normalized.printfulOrderId);
    const printfulDashboardUrl = normalized.printfulOrderId == null
      ? 'Non disponible'
      : `https://www.printful.com/dashboard/default/orders/${normalized.printfulOrderId}`;
    const failureDetails = normalized.failure
      ? `${normalized.failure.code}: ${normalized.failure.details}`
      : 'Aucune';
    const subject = normalized.failure ? OWNER_FAILURE_SUBJECT : OWNER_PREPARED_SUBJECT;
    const mismatchParams = normalized.failure?.code === 'draft_mismatch'
      ? {
        expected_printful_lines: formatMismatchLines(normalized.failure.expectedItems),
        actual_printful_lines: formatMismatchLines(normalized.failure.actualItems),
      }
      : {};
    await this.send(this.ownerTemplateId, {
      to_email: OWNER_EMAIL,
      reply_to: OWNER_EMAIL,
      subject,
      message: ownerMessage({
        subject,
        ...normalized,
        printfulOrderId,
        printfulDashboardUrl,
        amount,
        shippingDetails,
        orderLines,
        failureDetails,
      }),
      stripe_session_id: normalized.stripeSessionId,
      payment_intent_id: normalized.paymentIntentId,
      printful_order_id: printfulOrderId,
      printful_external_id: normalized.printfulExternalId,
      printful_dashboard_url: printfulDashboardUrl,
      amount_total: amount,
      shipping_details: shippingDetails,
      order_lines: orderLines,
      failure_details: failureDetails,
      name: `${normalized.firstName} ${normalized.lastName}`,
      email: normalized.customerEmail,
      address: shippingDetails,
      total: legacyTotal,
      cartItems: formatLegacyCartItems(normalized.lines),
      unusual_flags_html: unusualFlagsHtml(unusualOrderFlags(normalized)),
      mismatch_details_html: mismatchDetailsHtml(normalized.failure),
      ...mismatchParams,
    });
  }
}

module.exports = { EmailJsClient, EmailJsError };
