const PRINTFUL_API_URL = 'https://api.printful.com';
const REQUEST_TIMEOUT_MS = 15_000;
const EXTERNAL_ID_PATTERN = /^[A-Za-z0-9_-]{1,32}$/;
const VERTIFLOW_PRINTFUL_STORE_ID = 15558986;

class PrintfulOrderError extends Error {
  constructor(message, {
    retryable = false,
    status,
    duplicate = false,
    code,
    details,
  } = {}) {
    super(message);
    this.name = 'PrintfulOrderError';
    this.retryable = retryable;
    this.status = status;
    this.duplicate = duplicate;
    if (code !== undefined) this.code = code;
    if (details !== undefined) this.details = details;
  }
}

function invalidInput() {
  return new PrintfulOrderError('Invalid Printful draft input');
}

function requiredString(value, maxLength = 500) {
  if (typeof value !== 'string') throw invalidInput();
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) throw invalidInput();
  return trimmed;
}

function optionalString(value, maxLength = 500) {
  if (value == null || value === '') return '';
  return requiredString(value, maxLength);
}

function normalizeRecipient(recipient) {
  if (!recipient || typeof recipient !== 'object' || Array.isArray(recipient)) throw invalidInput();
  const countryCode = requiredString(recipient.country_code, 2).toUpperCase();
  if (!/^[A-Z]{2}$/.test(countryCode)) throw invalidInput();
  const email = requiredString(recipient.email, 320).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw invalidInput();

  const normalized = {
    name: requiredString(recipient.name, 200),
    address1: requiredString(recipient.address1, 200),
    address2: optionalString(recipient.address2, 200),
    city: requiredString(recipient.city, 200),
    zip: requiredString(recipient.zip, 50),
    country_code: countryCode,
    email,
    phone: optionalString(recipient.phone, 50),
  };
  const requiresStateCode = new Set(['US', 'CA', 'AU']);
  const stateCode = recipient.state_code == null || recipient.state_code === ''
    ? undefined
    : requiredString(recipient.state_code, 100);
  const taxNumber = recipient.tax_number == null || recipient.tax_number === ''
    ? undefined
    : requiredString(recipient.tax_number, 100);
  if (requiresStateCode.has(countryCode) && !stateCode) throw invalidInput();
  if (stateCode && !/^[A-Za-z0-9][A-Za-z0-9 .'-]*$/.test(stateCode)) throw invalidInput();
  if (countryCode === 'BR' && !taxNumber) throw invalidInput();
  if (stateCode) normalized.state_code = stateCode;
  if (taxNumber) normalized.tax_number = taxNumber;
  return normalized;
}

function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0 || items.length > 100) throw invalidInput();
  const seen = new Set();
  return items.map((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw invalidInput();
    const syncVariantId = Number(item.sync_variant_id);
    if (!Number.isInteger(syncVariantId) || syncVariantId <= 0 || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) {
      throw invalidInput();
    }
    if (seen.has(syncVariantId)) throw invalidInput();
    seen.add(syncVariantId);
    return { sync_variant_id: syncVariantId, quantity: item.quantity };
  });
}

function normalizeExternalId(externalId) {
  if (typeof externalId !== 'string' || !EXTERNAL_ID_PATTERN.test(externalId)) throw invalidInput();
  return externalId;
}

function normalizeExpected(expected) {
  if (Array.isArray(expected)) return { items: normalizeItems(expected) };
  if (!expected || typeof expected !== 'object') throw invalidInput();
  return {
    externalId: expected.externalId == null ? undefined : normalizeExternalId(expected.externalId),
    recipient: expected.recipient == null ? undefined : normalizeRecipient(expected.recipient),
    items: normalizeItems(expected.items),
  };
}

function itemMultiset(items) {
  return normalizeItems(items)
    .map(({ sync_variant_id, quantity }) => [sync_variant_id, quantity])
    .sort(([firstId], [secondId]) => firstId - secondId);
}

function sameValue(left, right) {
  return left === right;
}

function safeMismatchItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .slice(0, 100)
    .filter((item) => (
      item
      && typeof item === 'object'
      && Number.isInteger(item.sync_variant_id)
      && item.sync_variant_id > 0
      && Number.isInteger(item.quantity)
      && item.quantity > 0
      && item.quantity <= 10
    ))
    .map(({ sync_variant_id, quantity }) => ({ sync_variant_id, quantity }))
    .sort((first, second) => (
      first.sync_variant_id - second.sync_variant_id || first.quantity - second.quantity
    ));
}

function draftMismatch(details) {
  if (details === undefined) return new PrintfulOrderError('Printful draft mismatch');
  return new PrintfulOrderError(
    'Printful draft mismatch',
    { code: 'draft_mismatch', details },
  );
}

function validateDraft({ expected, actual }) {
  const normalizedExpected = normalizeExpected(expected);
  if (!actual || typeof actual !== 'object' || Array.isArray(actual)) {
    throw draftMismatch();
  }

  const actualStatus = typeof actual.status === 'string' ? actual.status.toLowerCase() : '';
  const mismatch = actualStatus !== 'draft' && actualStatus !== 'failed';
  if (mismatch) throw draftMismatch();

  try {
    if (normalizedExpected.externalId && actual.external_id !== normalizedExpected.externalId) {
      throw new Error('external ID');
    }
    if (normalizedExpected.recipient) {
      const actualRecipient = normalizeRecipient(actual.recipient);
      for (const [field, value] of Object.entries(normalizedExpected.recipient)) {
        if (!sameValue(actualRecipient[field], value)) throw new Error('recipient');
      }
      for (const field of ['state_code', 'tax_number']) {
        if (!sameValue(actualRecipient[field], normalizedExpected.recipient[field])) throw new Error('recipient');
      }
    }
  } catch {
    throw draftMismatch();
  }

  let actualItemMultiset;
  try {
    actualItemMultiset = itemMultiset(actual.items);
  } catch {
    throw draftMismatch({
      expectedItems: safeMismatchItems(normalizedExpected.items),
      actualItems: safeMismatchItems(actual.items),
    });
  }
  if (JSON.stringify(actualItemMultiset) !== JSON.stringify(itemMultiset(normalizedExpected.items))) {
    throw draftMismatch({
      expectedItems: safeMismatchItems(normalizedExpected.items),
      actualItems: safeMismatchItems(actual.items),
    });
  }
}

function isRetryableStatus(status) {
  return status === 408 || status === 419 || status === 429 || status >= 500;
}

function isDuplicateResponse(status, reason) {
  return status === 409 || (status === 400 && ['OR-13', 'EXTERNAL_ID_IN_USE'].includes(reason));
}

function isRetryableNetworkError(error) {
  const retryableNames = new Set(['AbortError', 'TimeoutError', 'ConnectTimeoutError']);
  const retryableCodes = new Set([
    'EAI_AGAIN', 'ENOTFOUND', 'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT',
    'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_SOCKET',
  ]);
  let current = error;
  for (let depth = 0; current && depth < 4; depth += 1) {
    if (retryableNames.has(current.name) || retryableCodes.has(current.code)) return true;
    current = current.cause;
  }
  return false;
}

function normalizeTransportError(error, status) {
  if (error instanceof PrintfulOrderError) return error;
  if (isRetryableNetworkError(error)) {
    return new PrintfulOrderError('Printful request timed out', { retryable: true, status });
  }
  return error;
}

class PrintfulOrdersClient {
  constructor({ apiKey, storeId, fetchImpl = globalThis.fetch, timeoutMs = REQUEST_TIMEOUT_MS }) {
    if (typeof apiKey !== 'string' || !apiKey.trim()) throw new Error('PRINTFUL_API_KEY is required');
    if (storeId !== VERTIFLOW_PRINTFUL_STORE_ID) throw new Error('The VertiFlow Printful store ID is required');
    if (typeof fetchImpl !== 'function') throw new Error('A fetch implementation is required');
    if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60_000) throw new Error('Invalid Printful timeout');
    this.apiKey = apiKey;
    this.storeId = String(VERTIFLOW_PRINTFUL_STORE_ID);
    this.fetch = fetchImpl;
    this.timeoutMs = timeoutMs;
  }

  async request(path, options) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      let response;
      try {
        response = await this.fetch(new URL(path, PRINTFUL_API_URL), {
          ...options,
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
            'X-PF-Store-Id': this.storeId,
            ...options.headers,
          },
        });
      } catch (error) {
        throw normalizeTransportError(error);
      }

      let text;
      try {
        text = await response.text();
      } catch (error) {
        throw normalizeTransportError(error, response.status);
      }

      let body;
      try {
        body = text ? JSON.parse(text) : {};
      } catch {
        throw new PrintfulOrderError('Printful returned an invalid response', {
          retryable: isRetryableStatus(response.status),
          status: response.status,
        });
      }

      const providerStatus = Number(body?.code);
      const status = Number.isInteger(providerStatus) && providerStatus >= 400
        ? providerStatus
        : response.status;
      const failed = !response.ok || !Number.isInteger(body.code) || body.code >= 400;
      if (failed) {
        const reason = typeof body?.error?.reason === 'string' ? body.error.reason : '';
        throw new PrintfulOrderError('Printful request was rejected', {
          retryable: isRetryableStatus(status),
          status,
          duplicate: isDuplicateResponse(status, reason),
        });
      }
      return body.result;
    } finally {
      clearTimeout(timeout);
    }
  }

  async getDraft(externalId) {
    return this.request(`/orders/@${encodeURIComponent(externalId)}`, { method: 'GET' });
  }

  async createOrGetDraft({ externalId, recipient, items }) {
    const expected = {
      externalId: normalizeExternalId(externalId),
      recipient: normalizeRecipient(recipient),
      items: normalizeItems(items),
    };
    let order;
    try {
      order = await this.request('/orders?confirm=false&update_existing=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          external_id: expected.externalId,
          recipient: expected.recipient,
          items: expected.items,
        }),
      });
    } catch (error) {
      if (!(error instanceof PrintfulOrderError) || !error.duplicate) throw error;
      order = await this.getDraft(expected.externalId);
    }
    validateDraft({ expected, actual: order });
    return order;
  }
}

module.exports = { PrintfulOrderError, PrintfulOrdersClient, validateDraft };
