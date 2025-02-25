// create-payment-intent.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_TEST_KEY);

exports.handler = async (event) => {
  try {
    // On attend { amount, customerInfo } dans le body de la requête
    const { amount, customerInfo } = JSON.parse(event.body);

    // Optionnel : vérifier que le montant est valide
    if (!amount || amount <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Montant invalide' }),
      };
    }

    // Création du PaymentIntent avec les méthodes de paiement automatiques activées
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // montant en centimes
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      metadata: {
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ clientSecret: paymentIntent.client_secret }),
    };
  } catch (error) {
    console.error("Erreur lors de la création du PaymentIntent :", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
