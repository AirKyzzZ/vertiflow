const assert = require('node:assert/strict');
const test = require('node:test');

const { EmailJsClient, EmailJsError } = require('../functions/lib/emailjs');

function sampleOrder(overrides = {}) {
  return {
    firstName: 'Léa',
    lastName: 'Martin',
    customerEmail: 'lea@example.com',
    stripeSessionId: 'cs_test_123',
    paymentIntentId: 'pi_test_123',
    amountTotal: 3698,
    currency: 'eur',
    printfulOrderId: 987,
    printfulExternalId: 'vf_01234567890123456789012345678',
    recipient: {
      name: 'Léa Martin',
      address1: '1 rue du Test',
      address2: '',
      city: 'Bordeaux',
      zip: '33000',
      country_code: 'FR',
      email: 'lea@example.com',
      phone: '',
    },
    lines: [{
      name: 'T-shirt CLIMB',
      color: 'Noir',
      size: 'M',
      quantity: 1,
      syncVariantId: 4736126964,
    }],
    ...overrides,
  };
}

function createClient(fetchImpl, overrides = {}) {
  return new EmailJsClient({
    serviceId: 'service_test',
    publicKey: 'public_test',
    privateKey: 'private_test',
    customerTemplateId: 'template_customer',
    ownerTemplateId: 'template_owner',
    fetchImpl,
    ...overrides,
  });
}

test('customer email is authenticated and uses the exact approved server-built French copy', async () => {
  let request;
  const client = createClient(async (url, options) => {
    request = { url, options };
    return new Response('OK', { status: 200 });
  });

  await client.sendCustomerConfirmation(sampleOrder());

  assert.equal(request.url, 'https://api.emailjs.com/api/v1.0/email/send');
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.headers['Content-Type'], 'application/json');
  const body = JSON.parse(request.options.body);
  assert.deepEqual({
    service_id: body.service_id,
    template_id: body.template_id,
    user_id: body.user_id,
    accessToken: body.accessToken,
  }, {
    service_id: 'service_test',
    template_id: 'template_customer',
    user_id: 'public_test',
    accessToken: 'private_test',
  });
  assert.deepEqual(body.template_params, {
    to_email: 'lea@example.com',
    first_name: 'Léa',
    last_name: 'Martin',
    reply_to: 'vertiflow.pro@gmail.com',
    subject: 'Confirmation de votre commande VertiFlow',
    message: [
      'Bonjour Léa Martin,',
      '',
      'VertiFlow confirme la bonne réception de votre commande. Tout est en ordre : la préparation est en cours et la livraison est estimée à environ 7-10 jours ouvrés.',
      '',
      'Pour toute question ou modification, il suffit de répondre à ce message.',
      '',
      'Cordialement,',
      '',
      'Maxime Mansiet',
      'Fondateur — VertiFlow',
      'vertiflow.pro@gmail.com',
      '07 83 97 23 60',
    ].join('\n'),
  });
});

test('owner email keeps structured facts and legacy aliases for a prepared order', async () => {
  let request;
  const client = createClient(async (url, options) => {
    request = { url, options };
    return new Response('OK', { status: 200 });
  });

  await client.sendOwnerReview(sampleOrder());

  const body = JSON.parse(request.options.body);
  assert.equal(body.template_id, 'template_owner');
  assert.deepEqual(body.template_params, {
    to_email: 'vertiflow.pro@gmail.com',
    reply_to: 'vertiflow.pro@gmail.com',
    subject: 'Commande VertiFlow à confirmer',
    message: [
      'Commande VertiFlow à confirmer',
      '',
      'Client: Léa Martin',
      'Email client: lea@example.com',
      'Stripe Session: cs_test_123',
      'PaymentIntent: pi_test_123',
      'Printful order: 987',
      'Printful external ID: vf_01234567890123456789012345678',
      'Printful dashboard: https://www.printful.com/dashboard/default/orders/987',
      'Montant: 36,98 EUR',
      '',
      'Livraison:',
      'Léa Martin',
      '1 rue du Test',
      '33000 Bordeaux',
      'FR',
      'lea@example.com',
      '',
      'Lignes:',
      '1 × T-shirt CLIMB — Noir — M — sync_variant_id 4736126964',
      '',
      'Échec de préparation: Aucune',
    ].join('\n'),
    stripe_session_id: 'cs_test_123',
    payment_intent_id: 'pi_test_123',
    printful_order_id: '987',
    printful_external_id: 'vf_01234567890123456789012345678',
    printful_dashboard_url: 'https://www.printful.com/dashboard/default/orders/987',
    amount_total: '36,98 EUR',
    shipping_details: 'Léa Martin\n1 rue du Test\n33000 Bordeaux\nFR\nlea@example.com',
    order_lines: '1 × T-shirt CLIMB — Noir — M — sync_variant_id 4736126964',
    failure_details: 'Aucune',
    name: 'Léa Martin',
    email: 'lea@example.com',
    address: 'Léa Martin\n1 rue du Test\n33000 Bordeaux\nFR\nlea@example.com',
    total: '36.98',
    cartItems: '<tr><td>T-shirt CLIMB — Noir — M</td><td>1</td><td>Prix unitaire non disponible</td></tr>',
  });
  assert.equal(Object.hasOwn(body.template_params, 'orders'), false);
});

test('owner legacy aliases remain usable for a permanent failure without recipient data', async () => {
  let request;
  const client = createClient(async (_url, options) => {
    request = options;
    return new Response('OK', { status: 200 });
  });

  await client.sendOwnerReview(sampleOrder({
    firstName: 'Client',
    lastName: 'VertiFlow',
    customerEmail: 'vertiflow.pro@gmail.com',
    printfulOrderId: null,
    recipient: null,
    lines: [],
    failure: { code: 'catalogue_mismatch', details: 'Paid lines require manual review.' },
  }));

  const params = JSON.parse(request.body).template_params;
  assert.equal(params.subject, 'Commande VertiFlow en échec');
  assert.equal(params.message, [
    'Commande VertiFlow en échec',
    '',
    'Client: Client VertiFlow',
    'Email client: vertiflow.pro@gmail.com',
    'Stripe Session: cs_test_123',
    'PaymentIntent: pi_test_123',
    'Printful order: Non créé',
    'Printful external ID: vf_01234567890123456789012345678',
    'Printful dashboard: Non disponible',
    'Montant: 36,98 EUR',
    '',
    'Livraison:',
    'Indisponible (voir erreur de préparation)',
    '',
    'Lignes:',
    'Aucune ligne canonique disponible',
    '',
    'Échec de préparation: catalogue_mismatch: Paid lines require manual review.',
  ].join('\n'));
  assert.equal(params.name, 'Client VertiFlow');
  assert.equal(params.email, 'vertiflow.pro@gmail.com');
  assert.equal(params.address, 'Indisponible (voir erreur de préparation)');
  assert.equal(params.total, '36.98');
  assert.equal(
    params.cartItems,
    '<tr><td>Aucune ligne canonique disponible</td><td>0</td><td>Prix unitaire non disponible</td></tr>',
  );
  assert.equal(params.failure_details, 'catalogue_mismatch: Paid lines require manual review.');
});

test('owner legacy double-brace aliases stay raw while cartItems safely owns all HTML', async () => {
  let request;
  const client = createClient(async (_url, options) => {
    request = options;
    return new Response('OK', { status: 200 });
  });

  await client.sendOwnerReview(sampleOrder({
    firstName: "Léa O'Connor",
    lastName: 'Martin & Fils',
    customerEmail: "o'connor&team@example.com",
    recipient: {
      ...sampleOrder().recipient,
      name: "Léa O'Connor & Fils",
      address1: "1 rue O'Connor & Sons",
      email: "o'connor&team@example.com",
    },
    lines: [{
      ...sampleOrder().lines[0],
      name: 'T-shirt <img src=x onerror=alert(1)>',
      color: 'Noir & <script>alert(1)</script>',
      size: 'M" onclick="alert(1)',
    }],
  }));

  const params = JSON.parse(request.body).template_params;
  assert.equal(params.name, "Léa O'Connor Martin & Fils");
  assert.equal(params.email, "o'connor&team@example.com");
  assert.match(params.address, /Léa O'Connor & Fils/);
  assert.match(params.address, /1 rue O'Connor & Sons/);
  assert.equal(params.total, '36.98');
  assert.equal(params.cartItems, [
    '<tr><td>T-shirt &lt;img src=x onerror=alert(1)&gt; — ',
    'Noir &amp; &lt;script&gt;alert(1)&lt;/script&gt; — ',
    'M&quot; onclick=&quot;alert(1)</td><td>1</td>',
    '<td>Prix unitaire non disponible</td></tr>',
  ].join(''));
  assert.equal(Object.hasOwn(params, 'orders'), false);
  assert.doesNotMatch(params.cartItems, /<(?!\/?(?:tr|td)>)/);
});

test('owner mismatch email separates bounded expected and actual Printful lines', async () => {
  let request;
  const client = createClient(async (_url, options) => {
    request = options;
    return new Response('OK', { status: 200 });
  });

  await client.sendOwnerReview(sampleOrder({
    printfulOrderId: null,
    failure: {
      code: 'draft_mismatch',
      details: 'Printful draft items do not match the paid order.',
      expectedItems: [{ sync_variant_id: 501, quantity: 2, customer: 'lea@example.com' }],
      actualItems: [{ sync_variant_id: 999, quantity: 1, provider_body: 'private-token' }],
    },
  }));

  const params = JSON.parse(request.body).template_params;
  assert.equal(params.expected_printful_lines, '2 × sync_variant_id 501');
  assert.equal(params.actual_printful_lines, '1 × sync_variant_id 999');
  assert.doesNotMatch(JSON.stringify(params), /private-token|provider_body|customer/);
});

test('EmailJS input validation is strict and happens before network access', async () => {
  let requests = 0;
  const client = createClient(async () => {
    requests += 1;
    return new Response('OK');
  });

  await assert.rejects(
    () => client.sendCustomerConfirmation(sampleOrder({ customerEmail: 'not-an-email' })),
    /Invalid email order data/,
  );
  await assert.rejects(
    () => client.sendOwnerReview(sampleOrder({ firstName: 'x'.repeat(101) })),
    /Invalid email order data/,
  );
  await assert.rejects(
    () => client.sendOwnerReview(sampleOrder({ lines: [] })),
    /Invalid email order data/,
  );
  assert.equal(requests, 0);
});

test('provider rejections and timeouts are retryable and redact provider response bodies', async () => {
  const rejected = createClient(async () => new Response(
    'private provider response for lea@example.com',
    { status: 429 },
  ));
  await assert.rejects(
    () => rejected.sendCustomerConfirmation(sampleOrder()),
    (error) => {
      assert.ok(error instanceof EmailJsError);
      assert.equal(error.retryable, true);
      assert.equal(error.status, 429);
      assert.doesNotMatch(error.message, /private|lea@example/);
      return true;
    },
  );

  const timedOut = createClient((_url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(Object.assign(new Error('socket details'), { name: 'AbortError' })));
  }), { timeoutMs: 5 });
  await assert.rejects(
    () => timedOut.sendCustomerConfirmation(sampleOrder()),
    (error) => error instanceof EmailJsError && error.retryable === true && !error.message.includes('socket details'),
  );
});

test('one client serializes concurrent customer and owner sends at the safe interval', async () => {
  let now = 1_000;
  const starts = [];
  const sleeps = [];
  const client = createClient(async () => {
    starts.push(now);
    return new Response('OK', { status: 200 });
  }, {
    now: () => now,
    sleep: async (milliseconds) => {
      sleeps.push(milliseconds);
      now += milliseconds;
    },
  });

  await Promise.all([
    client.sendCustomerConfirmation(sampleOrder()),
    client.sendOwnerReview(sampleOrder()),
  ]);

  assert.deepEqual(starts, [1_000, 2_100]);
  assert.deepEqual(sleeps, [1_100]);
});

test('send queue recovers after a retryable failure and still spaces the next start', async () => {
  let now = 5_000;
  const starts = [];
  const sleeps = [];
  const client = createClient(async () => {
    starts.push(now);
    return new Response('provider rate limit', { status: starts.length === 1 ? 429 : 200 });
  }, {
    now: () => now,
    sleep: async (milliseconds) => {
      sleeps.push(milliseconds);
      now += milliseconds;
    },
  });

  const [first, second] = await Promise.allSettled([
    client.sendCustomerConfirmation(sampleOrder()),
    client.sendOwnerReview(sampleOrder()),
  ]);

  assert.equal(first.status, 'rejected');
  assert.ok(first.reason instanceof EmailJsError);
  assert.equal(first.reason.status, 429);
  assert.equal(second.status, 'fulfilled');
  assert.deepEqual(starts, [5_000, 6_100]);
  assert.deepEqual(sleeps, [1_100]);
});
