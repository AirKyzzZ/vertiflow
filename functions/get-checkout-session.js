function response(statusCode, body, headers = {}) {
  return { statusCode, headers, body: JSON.stringify(body) };
}

function validSessionId(sessionId) {
  return typeof sessionId === 'string' && /^cs_[A-Za-z0-9_]{1,500}$/.test(sessionId);
}

function validateEnvironment(environment) {
  if (!/^(?:sk|rk)_test_[A-Za-z0-9_]+$/.test(environment?.STRIPE_SECRET_KEY || '')) {
    throw new Error('A Stripe test secret is required');
  }
}

function createCheckoutStatusHandler({ stripe, environment }) {
  return async (event) => {
    if (event.httpMethod !== 'POST') return response(405, { error: 'Method not allowed' }, { Allow: 'POST' });

    let payload;
    try {
      payload = JSON.parse(event.body);
    } catch {
      return response(400, { error: 'Invalid checkout status request' });
    }
    if (!validSessionId(payload?.sessionId)) return response(400, { error: 'Invalid checkout status request' });

    try {
      validateEnvironment(environment);
      const session = await stripe.checkout.sessions.retrieve(payload.sessionId);
      if (typeof session?.status !== 'string' || typeof session?.payment_status !== 'string') throw new Error('Incomplete Checkout Session');
      return response(200, { status: session.status, paymentStatus: session.payment_status });
    } catch (error) {
      console.error('Checkout status lookup failed:', error);
      return response(500, { error: 'Checkout status unavailable' });
    }
  };
}

exports.createCheckoutStatusHandler = createCheckoutStatusHandler;
exports.handler = async (event) => {
  try {
    validateEnvironment(process.env);
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    return createCheckoutStatusHandler({ stripe, environment: process.env })(event);
  } catch (error) {
    console.error('Checkout status configuration failed:', error);
    return response(500, { error: 'Checkout status unavailable' });
  }
};
