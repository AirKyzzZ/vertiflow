const assert = require('node:assert/strict');
const test = require('node:test');

const { createCheckoutStatusHandler, handler } = require('../functions/get-checkout-session');

const environment = { STRIPE_SECRET_KEY: 'sk_test_example' };
const event = (body, method = 'POST') => ({ httpMethod: method, body: JSON.stringify(body) });

test('returns only a retrieved Checkout Session payment status', async () => {
  const calls = [];
  const stripe = { checkout: { sessions: { retrieve: async (sessionId) => {
    calls.push(sessionId);
    return { status: 'complete', payment_status: 'paid', customer: 'cus_private', client_secret: 'secret' };
  } } } };

  const response = await createCheckoutStatusHandler({ stripe, environment })(event({ sessionId: 'cs_test_123' }));
  assert.equal(response.statusCode, 200);
  assert.deepEqual(calls, ['cs_test_123']);
  assert.deepEqual(JSON.parse(response.body), { status: 'complete', paymentStatus: 'paid' });
});

test('reports no_payment_required without treating it as a paid checkout', async () => {
  const stripe = { checkout: { sessions: { retrieve: async () => ({
    status: 'complete', payment_status: 'no_payment_required',
  }) } } };

  const response = await createCheckoutStatusHandler({ stripe, environment })(event({ sessionId: 'cs_test_free' }));
  assert.deepEqual(JSON.parse(response.body), { status: 'complete', paymentStatus: 'no_payment_required' });
});

test('rejects non-POST, malformed, and invalid Checkout Session identifiers without retrieval', async () => {
  let calls = 0;
  const stripe = { checkout: { sessions: { retrieve: async () => { calls += 1; } } } };
  const endpoint = createCheckoutStatusHandler({ stripe, environment });

  assert.equal((await endpoint(event({}, 'GET'))).statusCode, 405);
  assert.equal((await endpoint({ httpMethod: 'POST', body: '{' })).statusCode, 400);
  assert.equal((await endpoint(event({ sessionId: 'pi_test_123' }))).statusCode, 400);
  assert.equal((await endpoint(event({ sessionId: `cs_${'a'.repeat(501)}` }))).statusCode, 400);
  assert.equal(calls, 0);
});

test('uses a test-mode secret and returns a controlled server error', async () => {
  const stripe = { checkout: { sessions: { retrieve: async () => { throw new Error('Stripe failure'); } } } };
  assert.equal((await createCheckoutStatusHandler({ stripe, environment: { STRIPE_SECRET_KEY: 'sk_live_example' } })(event({ sessionId: 'cs_test_123' }))).statusCode, 500);
  const response = await createCheckoutStatusHandler({ stripe, environment })(event({ sessionId: 'cs_test_123' }));
  assert.equal(response.statusCode, 500);
  assert.deepEqual(JSON.parse(response.body), { error: 'Checkout status unavailable' });
});

test('accepts a live Stripe secret key', async () => {
  const response = await createCheckoutStatusHandler({
    stripe: { checkout: { sessions: { retrieve: async () => ({
      status: 'complete', payment_status: 'paid',
    }) } } },
    environment: { STRIPE_SECRET_KEY: 'sk_live_example' },
  })(event({ sessionId: 'cs_live_123' }));
  assert.equal(response.statusCode, 200);
  assert.deepEqual(JSON.parse(response.body), { status: 'complete', paymentStatus: 'paid' });
});

test('accepts a permissioned restricted test key', async () => {
  const stripe = { checkout: { sessions: { retrieve: async () => ({
    status: 'complete', payment_status: 'paid',
  }) } } };
  const response = await createCheckoutStatusHandler({
    stripe,
    environment: { STRIPE_SECRET_KEY: 'rk_test_checkout_reader' },
  })(event({ sessionId: 'cs_test_123' }));
  assert.equal(response.statusCode, 200);
});

test('exported handler handles missing configuration before Stripe construction', async () => {
  const original = process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_SECRET_KEY;
  try {
    const response = await handler(event({ sessionId: 'cs_test_123' }));
    assert.equal(response.statusCode, 500);
    assert.deepEqual(JSON.parse(response.body), { error: 'Checkout status unavailable' });
  } finally {
    if (original === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = original;
  }
});
