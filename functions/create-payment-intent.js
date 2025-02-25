const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  try {
    // Attendez-vous à recevoir { amount, customerInfo } ou un objet similaire
    const { amount } = JSON.parse(event.body);
    
    // Créez un PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // montant en centimes
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ clientSecret: paymentIntent.client_secret }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
