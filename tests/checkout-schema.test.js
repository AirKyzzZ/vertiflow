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

  await t.test('the US/CA/AU state rule: required when missing, accepted once provided, matching the server', () => {
    for (const country of STATE_REQUIRED_COUNTRIES) {
      const withoutState = { ...base, country, state: '' };
      const clientResult = checkoutSchema.safeParse(withoutState);
      assert.equal(clientResult.success, false, `${country} without state should fail client-side`);
      assert.ok(
        clientResult.error.issues.some((issue) => issue.path.join('.') === 'state'),
        `${country} without state should flag the state field`,
      );
      assert.throws(
        () => validateCustomer(toServerCustomer(withoutState)),
        ValidationError,
        `${country} without state should also 400 server-side`,
      );

      const withState = { ...base, country, state: 'CA' };
      assert.equal(checkoutSchema.safeParse(withState).success, true, `${country} with a state should pass client-side`);
      assert.doesNotThrow(() => validateCustomer(toServerCustomer(withState)), `${country} with a state should pass server-side`);
    }
  });

  await t.test('does not require a state outside US/CA/AU', () => {
    for (const country of ['FR', 'DE', 'GB', 'JP']) {
      if (STATE_REQUIRED_COUNTRIES.has(country)) continue;
      const values = { ...base, country: COUNTRIES.some((c) => c.code === country) ? country : 'FR', state: '' };
      assert.equal(checkoutSchema.safeParse(values).success, true);
    }
  });

  await t.test('GB-not-UK: UK is rejected client-side with a message pointing at GB, and the server agrees', () => {
    const ukValues = { ...base, country: 'UK' };
    const result = checkoutSchema.safeParse(ukValues);
    assert.equal(result.success, false);
    assert.ok(result.error.issues.some((issue) => issue.path.join('.') === 'country' && /GB/.test(issue.message)));
    assert.throws(() => validateCustomer(toServerCustomer(ukValues)), ValidationError);

    const gbValues = { ...base, country: 'GB' };
    assert.equal(checkoutSchema.safeParse(gbValues).success, true);
    assert.doesNotThrow(() => validateCustomer(toServerCustomer(gbValues)));
  });

  await t.test('BR rejection: Brazil is refused client-side, matching the server’s tax-number rule', () => {
    const values = { ...base, country: 'BR' };
    const result = checkoutSchema.safeParse(values);
    assert.equal(result.success, false);
    assert.ok(result.error.issues.some((issue) => issue.path.join('.') === 'country'));
    assert.throws(() => validateCustomer(toServerCustomer(values)), ValidationError);
  });

  await t.test('the client country list is well-formed: unique, 2-letter uppercase, GB present, UK absent', () => {
    const codes = COUNTRIES.map((option) => option.code);
    assert.equal(new Set(codes).size, codes.length, 'no duplicate country codes');
    assert.ok(codes.every((code) => /^[A-Z]{2}$/.test(code)), 'every code is exactly 2 uppercase letters');
    assert.ok(codes.includes('GB'), 'GB must be offered for the United Kingdom');
    assert.ok(!codes.includes('UK'), 'UK must never be offered, only GB');
  });

  await t.test('every non-Brazil code the client offers is actually accepted by the real server contract', () => {
    for (const option of COUNTRIES) {
      if (option.code === 'BR') continue;
      const values = {
        ...base,
        country: option.code,
        state: STATE_REQUIRED_COUNTRIES.has(option.code) ? 'XX' : '',
      };
      assert.doesNotThrow(
        () => validateCustomer(toServerCustomer(values)),
        `${option.code} is offered client-side but rejected by validateCustomer — the client list has drifted from the server contract`,
      );
    }
  });

  await t.test('BR stays listed (disabled) so the server’s explicit Brazil rule is exercised, never silently dropped', () => {
    const option = COUNTRIES.find((c) => c.code === 'BR');
    assert.ok(option, 'BR should remain visible-but-disabled rather than silently removed');
    assert.equal(option.disabled, true);
  });
});
