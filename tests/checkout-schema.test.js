const assert = require('node:assert/strict');
const test = require('node:test');
const { validateCustomer, ValidationError } = require('../functions/lib/catalogue');

const base = {
  firstName: 'Max',
  lastName: 'Mansiet',
  email: 'max@example.com',
  phone: '',
  line1: '1 rue Test',
  line2: '',
  city: 'Bordeaux',
  postalCode: '33000',
  country: 'FR',
  state: '',
};

function toServerCustomer(values) {
  return {
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email,
    phone: values.phone,
    address: {
      line1: values.line1,
      line2: values.line2,
      city: values.city,
      postal_code: values.postalCode,
      country: values.country,
      state: values.state,
    },
  };
}

test('checkout zod schema mirrors the server validateCustomer contract', async (t) => {
  const { checkoutSchema, COUNTRIES, STATE_REQUIRED_COUNTRIES, DEFAULT_COUNTRY } = await import('../src/lib/checkout-schema.ts');

  await t.test('accepts a valid French customer, matching the server', () => {
    assert.equal(checkoutSchema.safeParse(base).success, true);
    assert.doesNotThrow(() => validateCustomer(toServerCustomer(base)));
  });

  await t.test('defaults to FR', () => {
    assert.equal(DEFAULT_COUNTRY, 'FR');
  });

  await t.test('requires firstName, lastName, email, line1, city, postalCode and country', () => {
    for (const field of ['firstName', 'lastName', 'email', 'line1', 'city', 'postalCode', 'country']) {
      const result = checkoutSchema.safeParse({ ...base, [field]: '' });
      assert.equal(result.success, false, `${field} should be required`);
    }
  });

  await t.test('leaves phone, line2 and state optional', () => {
    assert.equal(checkoutSchema.safeParse({ ...base, phone: '', line2: '', state: '' }).success, true);
  });

  await t.test('rejects a malformed email the same way the server does', () => {
    const values = { ...base, email: 'not-an-email' };
    assert.equal(checkoutSchema.safeParse(values).success, false);
    assert.throws(() => validateCustomer(toServerCustomer(values)), ValidationError);
  });

  await t.test('France only: every other country is refused client-side and server-side', () => {
    for (const country of ['DE', 'GB', 'BE', 'CH', 'US', 'BR']) {
      const values = { ...base, country, state: 'XX' };
      const result = checkoutSchema.safeParse(values);
      assert.equal(result.success, false, `${country} should fail client-side`);
      assert.ok(
        result.error.issues.some((issue) => issue.path.join('.') === 'country'),
        `${country} should flag the country field`,
      );
      assert.throws(
        () => validateCustomer(toServerCustomer(values)),
        ValidationError,
        `${country} should also 400 server-side, not just be hidden from the dropdown`,
      );
    }
  });

  await t.test('France needs no state', () => {
    assert.equal(checkoutSchema.safeParse({ ...base, country: 'FR', state: '' }).success, true);
    assert.doesNotThrow(() => validateCustomer(toServerCustomer({ ...base, country: 'FR', state: '' })));
  });

  await t.test('UK still gets the GB-not-UK message rather than the France message', () => {
    const result = checkoutSchema.safeParse({ ...base, country: 'UK' });
    assert.equal(result.success, false);
    assert.ok(result.error.issues.some((issue) => issue.path.join('.') === 'country' && /GB/.test(issue.message)));
    assert.throws(() => validateCustomer(toServerCustomer({ ...base, country: 'UK' })), /GB/);
  });

  await t.test('the client country list is well-formed: unique, 2-letter uppercase, France only', () => {
    const codes = COUNTRIES.map((option) => option.code);
    assert.equal(new Set(codes).size, codes.length, 'no duplicate country codes');
    assert.ok(codes.every((code) => /^[A-Z]{2}$/.test(code)), 'every code is exactly 2 uppercase letters');
    assert.deepEqual(codes, ['FR'], 'only France is offered while one flat shipping rate is configured');
    assert.ok(!codes.includes('UK'), 'UK must never be offered, only GB');
  });

  await t.test('every code the client offers is actually accepted by the real server contract', () => {
    for (const option of COUNTRIES) {
      const values = { ...base, country: option.code, state: STATE_REQUIRED_COUNTRIES.has(option.code) ? 'XX' : '' };
      assert.doesNotThrow(
        () => validateCustomer(toServerCustomer(values)),
        `${option.code} is offered client-side but rejected by validateCustomer — the client list has drifted from the server contract`,
      );
    }
  });
});
