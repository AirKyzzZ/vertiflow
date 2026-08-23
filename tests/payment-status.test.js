const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { checkPaymentStatus } = require('../src/lib/payment-status.ts');

const ROOT = path.resolve(__dirname, '..');

function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function jsonResponse(ok, body) {
  return { ok, json: async () => body };
}

test('a confirmed paid response resolves immediately without retrying', async () => {
  let calls = 0;
  const result = await checkPaymentStatus('cs_test_1', async () => {
    calls += 1;
    return jsonResponse(true, { paymentStatus: 'paid' });
  });
  assert.equal(result, 'paid');
  assert.equal(calls, 1);
});

test('a confirmed non-paid response is trusted and not retried', async () => {
  let calls = 0;
  const result = await checkPaymentStatus('cs_test_1', async () => {
    calls += 1;
    return jsonResponse(true, { paymentStatus: 'unpaid' });
  });
  assert.equal(result, 'unpaid');
  assert.equal(calls, 1);
});

test('a non-ok response is retried up to the attempt limit and never reads as unpaid', async () => {
  let calls = 0;
  const result = await checkPaymentStatus(
    'cs_test_1',
    async () => {
      calls += 1;
      return jsonResponse(false, {});
    },
    { attempts: 3, wait: async () => {} },
  );
  assert.equal(result, 'checking');
  assert.equal(calls, 3);
});

test('a network failure is retried and never reads as unpaid', async () => {
  let calls = 0;
  const result = await checkPaymentStatus(
    'cs_test_1',
    async () => {
      calls += 1;
      throw new Error('network down');
    },
    { attempts: 3, wait: async () => {} },
  );
  assert.equal(result, 'checking');
  assert.equal(calls, 3);
});

test('a late success after earlier blips is still reported paid', async () => {
  let calls = 0;
  const result = await checkPaymentStatus(
    'cs_test_1',
    async () => {
      calls += 1;
      if (calls < 3) throw new Error('network down');
      return jsonResponse(true, { paymentStatus: 'paid' });
    },
    { attempts: 4, wait: async () => {} },
  );
  assert.equal(result, 'paid');
  assert.equal(calls, 3);
});

test('backoff delay grows between attempts', async () => {
  const delays = [];
  await checkPaymentStatus(
    'cs_test_1',
    async () => jsonResponse(false, {}),
    {
      attempts: 3,
      delayMs: 100,
      wait: async (ms) => { delays.push(ms); },
    },
  );
  assert.deepEqual(delays, [100, 200]);
});

test('the cart clears where payment is confirmed, not where the success page merely reads status', () => {
  const checkoutForm = readProjectFile('src/components/checkout-form.tsx');
  const succesClient = readProjectFile('src/app/commande/succes/succes-client.tsx');
  assert.match(checkoutForm, /actionsRef\.current\.confirm\(\{\s*redirect:\s*'if_required'\s*\}\)/);
  assert.match(checkoutForm, /clear\(\)/);
  assert.doesNotMatch(succesClient, /useCart|clear\(\)/);
});
