const assert = require('node:assert/strict');
const test = require('node:test');

const {
  PrintfulOrderError,
  PrintfulOrdersClient,
  validateDraft,
} = require('../functions/lib/printful-orders');

const recipient = {
  name: 'Léa Martin',
  address1: '1 rue du Test',
  address2: 'Appartement 2',
  city: 'Bordeaux',
  zip: '33000',
  country_code: 'FR',
  email: 'lea@example.com',
  phone: '+33612345678',
};

const items = [
  { sync_variant_id: 501, quantity: 2 },
  { sync_variant_id: 502, quantity: 1 },
];

function response(body, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

function draft(overrides = {}) {
  return {
    id: 987,
    external_id: 'cs_test_123',
    status: 'draft',
    recipient,
    items,
    ...overrides,
  };
}

test('Printful orders are restricted to the exact numeric VertiFlow store ID before fetch', () => {
  let fetchCalls = 0;
  const fetchImpl = async () => {
    fetchCalls += 1;
    return response({ code: 200, result: draft() });
  };

  for (const storeId of [1, 15558985, 15558987, '15558986', null, undefined]) {
    assert.throws(
      () => new PrintfulOrdersClient({ apiKey: 'token', storeId, fetchImpl }),
      /VertiFlow Printful store/,
    );
  }
  assert.equal(fetchCalls, 0);
});

test('createOrGetDraft creates an unconfirmed, store-scoped Printful draft with exact data', async () => {
  let request;
  const fetchImpl = async (url, options) => {
    request = { url: new URL(url), options };
    return response({ code: 200, result: draft() });
  };
  const client = new PrintfulOrdersClient({ apiKey: 'token', storeId: 15558986, fetchImpl });

  const order = await client.createOrGetDraft({ externalId: 'cs_test_123', recipient, items });

  assert.equal(request.url.pathname, '/orders');
  assert.equal(request.url.searchParams.get('confirm'), 'false');
  assert.equal(request.url.searchParams.get('update_existing'), 'true');
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.headers['X-PF-Store-Id'], '15558986');
  assert.deepEqual(JSON.parse(request.options.body), {
    external_id: 'cs_test_123', recipient, items,
  });
  assert.equal(order.status, 'draft');
});

test('createOrGetDraft recovers an existing draft by external ID after a duplicate response', async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url: new URL(url), options });
    if (options.method === 'POST') return response({ code: 409, error: { message: 'duplicate' } }, 409);
    return response({ code: 200, result: draft() });
  };
  const client = new PrintfulOrdersClient({ apiKey: 'token', storeId: 15558986, fetchImpl });

  const order = await client.createOrGetDraft({ externalId: 'cs_test_123', recipient, items });

  assert.equal(order.id, 987);
  assert.equal(requests.length, 2);
  assert.equal(requests[1].url.pathname, '/orders/@cs_test_123');
  assert.equal(requests[1].options.method, 'GET');
  assert.equal(requests[1].options.headers['X-PF-Store-Id'], '15558986');
});

test('duplicate recovery also honors a Printful error code when the HTTP transport is 200', async () => {
  let calls = 0;
  const client = new PrintfulOrdersClient({
    apiKey: 'token',
    storeId: 15558986,
    fetchImpl: async () => {
      calls += 1;
      return calls === 1
        ? response({ code: 409, error: { message: 'duplicate' } })
        : response({ code: 200, result: draft() });
    },
  });

  const order = await client.createOrGetDraft({ externalId: 'cs_test_123', recipient, items });

  assert.equal(order.id, 987);
  assert.equal(calls, 2);
});

test('duplicate recovery recognizes Printful OR-13 and EXTERNAL_ID_IN_USE error reasons over HTTP 400', async () => {
  for (const reason of ['OR-13', 'EXTERNAL_ID_IN_USE']) {
    let calls = 0;
    const client = new PrintfulOrdersClient({
      apiKey: 'token',
      storeId: 15558986,
      fetchImpl: async () => {
        calls += 1;
        return calls === 1
          ? response({ code: 400, error: { reason, message: 'duplicate for Léa Martin' } }, 400)
          : response({ code: 200, result: draft() });
      },
    });

    const order = await client.createOrGetDraft({ externalId: 'cs_test_123', recipient, items });

    assert.equal(order.id, 987);
    assert.equal(calls, 2);
  }
});

test('validateDraft compares external ID, supported draft status, exact recipient facts, and item multiset', () => {
  assert.doesNotThrow(() => validateDraft({
    expected: { externalId: 'cs_test_123', recipient, items },
    actual: draft({ items: [...items].reverse() }),
  }));

  for (const actual of [
    draft({ external_id: 'cs_test_other' }),
    draft({ status: 'fulfilled' }),
    draft({ recipient: { ...recipient, zip: '75001' } }),
    draft({ items: [{ sync_variant_id: 501, quantity: 1 }, { sync_variant_id: 501, quantity: 1 }, { sync_variant_id: 502, quantity: 1 }] }),
  ]) {
    assert.throws(
      () => validateDraft({ expected: { externalId: 'cs_test_123', recipient, items }, actual }),
      /Printful draft mismatch/,
    );
  }
});

test('item mismatches expose only bounded normalized line details', () => {
  const actualItems = Array.from({ length: 105 }, (_, index) => ({
    sync_variant_id: 700 + index,
    quantity: (index % 3) + 1,
    recipient_email: 'lea@example.com',
    provider_body: { secret: 'private-token' },
  })).reverse();
  actualItems.push({ sync_variant_id: -1, quantity: 1, recipient_email: 'leak@example.com' });
  let failure;

  assert.throws(
    () => validateDraft({
      expected: { externalId: 'cs_test_123', recipient, items: [...items].reverse() },
      actual: draft({ items: actualItems }),
    }),
    (error) => {
      failure = error;
      return error instanceof PrintfulOrderError;
    },
  );

  assert.equal(failure.message, 'Printful draft mismatch');
  assert.equal(failure.code, 'draft_mismatch');
  assert.equal(failure.retryable, false);
  assert.deepEqual(failure.details.expectedItems, [
    { sync_variant_id: 501, quantity: 2 },
    { sync_variant_id: 502, quantity: 1 },
  ]);
  assert.equal(failure.details.actualItems.length, 100);
  assert.deepEqual(failure.details.actualItems[0], { sync_variant_id: 705, quantity: 3 });
  assert.deepEqual(failure.details.actualItems.at(-1), { sync_variant_id: 804, quantity: 3 });
  assert.deepEqual(Object.keys(failure.details.actualItems[0]).sort(), ['quantity', 'sync_variant_id']);
  assert.doesNotMatch(JSON.stringify(failure), /Léa|lea@example|leak@example|private-token|provider_body/);
});

test('non-item draft mismatches retain the generic redacted error contract', () => {
  for (const actual of [
    draft({ external_id: 'private-provider-body' }),
    draft({ status: 'fulfilled', provider_body: { secret: 'private-token' } }),
    draft({ recipient: { ...recipient, email: 'other@example.com' } }),
  ]) {
    assert.throws(
      () => validateDraft({ expected: { externalId: 'cs_test_123', recipient, items }, actual }),
      (error) => {
        assert.ok(error instanceof PrintfulOrderError);
        assert.equal(error.message, 'Printful draft mismatch');
        assert.equal(Object.hasOwn(error, 'code'), false);
        assert.equal(Object.hasOwn(error, 'details'), false);
        assert.doesNotMatch(JSON.stringify(error), /Léa|example.com|private-token|provider_body/);
        return true;
      },
    );
  }
});

test('recipient state and tax fields are preserved, required when mandated, and compared exactly', async () => {
  const usRecipient = { ...recipient, country_code: 'US', state_code: 'CA' };
  const brRecipient = { ...recipient, country_code: 'BR', tax_number: '123.456.789-00' };
  let submitted;
  const client = new PrintfulOrdersClient({
    apiKey: 'token',
    storeId: 15558986,
    fetchImpl: async (_url, options) => {
      submitted = JSON.parse(options.body);
      return response({ code: 200, result: draft({ recipient: submitted.recipient }) });
    },
  });

  await client.createOrGetDraft({ externalId: 'cs_test_123', recipient: usRecipient, items });
  assert.equal(submitted.recipient.state_code, 'CA');
  assert.equal(Object.hasOwn(submitted.recipient, 'tax_number'), false);
  await client.createOrGetDraft({ externalId: 'cs_test_123', recipient: brRecipient, items });
  assert.equal(submitted.recipient.tax_number, '123.456.789-00');
  assert.equal(Object.hasOwn(submitted.recipient, 'state_code'), false);

  for (const invalidRecipient of [
    { ...recipient, country_code: 'US' },
    { ...recipient, country_code: 'CA', state_code: '   ' },
    { ...recipient, country_code: 'AU', state_code: 'x'.repeat(101) },
    { ...recipient, country_code: 'BR' },
    { ...recipient, country_code: 'BR', tax_number: '   ' },
  ]) {
    await assert.rejects(
      () => client.createOrGetDraft({ externalId: 'cs_test_123', recipient: invalidRecipient, items }),
      /Invalid Printful draft input/,
    );
  }

  assert.throws(() => validateDraft({
    expected: { externalId: 'cs_test_123', recipient: usRecipient, items },
    actual: draft({ recipient: { ...usRecipient, state_code: 'NY' } }),
  }), /Printful draft mismatch/);
  assert.throws(() => validateDraft({
    expected: { externalId: 'cs_test_123', recipient: brRecipient, items },
    actual: draft({ recipient: { ...brRecipient, tax_number: 'other' } }),
  }), /Printful draft mismatch/);
});

test('input validation fails closed before any network request', async () => {
  let calls = 0;
  const client = new PrintfulOrdersClient({
    apiKey: 'token',
    storeId: 15558986,
    fetchImpl: async () => { calls += 1; return response({}); },
  });

  for (const invalid of [
    { externalId: 'not valid!', recipient, items },
    { externalId: 'x'.repeat(33), recipient, items },
    { externalId: 'cs_test_123', recipient: { ...recipient, country_code: 'France' }, items },
    { externalId: 'cs_test_123', recipient, items: [{ sync_variant_id: 501, quantity: 0 }] },
    { externalId: 'cs_test_123', recipient, items: [{ sync_variant_id: 501, quantity: 1 }, { sync_variant_id: 501, quantity: 1 }] },
  ]) {
    await assert.rejects(() => client.createOrGetDraft(invalid), /Invalid Printful draft input/);
  }
  assert.equal(calls, 0);
});

test('provider failures are classified without exposing provider bodies or recipient data', async () => {
  const client = new PrintfulOrdersClient({
    apiKey: 'private-token',
    storeId: 15558986,
    fetchImpl: async () => response({ code: 422, error: { message: 'Léa Martin lea@example.com private-token' } }, 422),
  });

  await assert.rejects(
    () => client.createOrGetDraft({ externalId: 'cs_test_123', recipient, items }),
    (error) => {
      assert.ok(error instanceof PrintfulOrderError);
      assert.equal(error.retryable, false);
      assert.equal(error.status, 422);
      assert.doesNotMatch(error.message, /Léa|lea@example|private-token/);
      return true;
    },
  );
});

test('timeouts, rate limits, session expiry, and server failures are retryable', async () => {
  for (const fetchImpl of [
    async () => { const error = new Error('timed out'); error.name = 'AbortError'; throw error; },
    async () => response({ code: 408 }, 408),
    async () => response({ code: 419 }, 419),
    async () => response({ code: 429 }, 429),
    async () => response({ code: 503 }, 503),
  ]) {
    const client = new PrintfulOrdersClient({ apiKey: 'token', storeId: 15558986, fetchImpl });
    await assert.rejects(
      () => client.createOrGetDraft({ externalId: 'cs_test_123', recipient, items }),
      (error) => error instanceof PrintfulOrderError && error.retryable === true,
    );
  }
});

test('known Node fetch transient failures and the client timeout are retryable', async () => {
  const transientCauses = ['EAI_AGAIN', 'ENOTFOUND', 'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT'];
  for (const code of transientCauses) {
    const error = new TypeError('fetch failed');
    error.cause = Object.assign(new Error('network failure'), { code });
    const client = new PrintfulOrdersClient({ apiKey: 'token', storeId: 15558986, fetchImpl: async () => { throw error; } });
    await assert.rejects(
      () => client.createOrGetDraft({ externalId: 'cs_test_123', recipient, items }),
      (failure) => failure instanceof PrintfulOrderError && failure.retryable === true,
    );
  }

  const programmingError = new TypeError('cannot read property');
  const permanentClient = new PrintfulOrdersClient({ apiKey: 'token', storeId: 15558986, fetchImpl: async () => { throw programmingError; } });
  await assert.rejects(
    () => permanentClient.createOrGetDraft({ externalId: 'cs_test_123', recipient, items }),
    (failure) => failure === programmingError,
  );

  const timeoutClient = new PrintfulOrdersClient({
    apiKey: 'token',
    storeId: 15558986,
    timeoutMs: 5,
    fetchImpl: async (_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
    }),
  });
  await assert.rejects(
    () => timeoutClient.createOrGetDraft({ externalId: 'cs_test_123', recipient, items }),
    (failure) => failure instanceof PrintfulOrderError && failure.retryable === true,
  );
});

test('the request timeout remains active while a Printful response body is stalled', async () => {
  const client = new PrintfulOrdersClient({
    apiKey: 'token',
    storeId: 15558986,
    timeoutMs: 5,
    fetchImpl: async (_url, options) => ({
      ok: true,
      status: 200,
      text: () => new Promise((resolve, reject) => {
        const watchdog = setTimeout(() => reject(new Error('test body stalled')), 50);
        options.signal.addEventListener('abort', () => {
          clearTimeout(watchdog);
          reject(Object.assign(new Error('aborted while reading body'), { name: 'AbortError' }));
        });
      }),
    }),
  });

  await assert.rejects(
    () => client.createOrGetDraft({ externalId: 'cs_test_123', recipient, items }),
    (failure) => failure instanceof PrintfulOrderError && failure.retryable === true,
  );
});
