// stripe-webhook.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  try {
    const sig = event.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    let stripeEvent;
    
    try {
      stripeEvent = stripe.webhooks.constructEvent(event.body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Webhook signature verification failed' }),
      };
    }

    // Handle the event
    switch (stripeEvent.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = stripeEvent.data.object;
        console.log('Payment succeeded:', paymentIntent.id);
        
        // Update metadata with payment success status
        await stripe.paymentIntents.update(paymentIntent.id, {
          metadata: {
            ...paymentIntent.metadata,
            paymentStatus: 'succeeded',
            paymentDate: new Date().toISOString(),
            shippingStatus: 'En préparation'
          }
        });
        
        break;
        
      case 'payment_intent.payment_failed':
        const failedPayment = stripeEvent.data.object;
        console.log('Payment failed:', failedPayment.id);
        
        // Update metadata with payment failure status
        await stripe.paymentIntents.update(failedPayment.id, {
          metadata: {
            ...failedPayment.metadata,
            paymentStatus: 'failed',
            paymentDate: new Date().toISOString(),
            shippingStatus: 'Paiement échoué'
          }
        });
        
        break;
        
      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error('Webhook error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
