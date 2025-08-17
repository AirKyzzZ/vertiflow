// create-payment-intent.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  try {
    // On attend { amount, customerInfo, cart } dans le body de la requête
    const { amount, customerInfo, cart } = JSON.parse(event.body);

    // Optionnel : vérifier que le montant est valide
    if (!amount || amount <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Montant invalide' }),
      };
    }

    // Préparer les métadonnées détaillées pour le shipping
    const metadata = {
      // Informations client
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      customerPhone: customerInfo.phone || 'Non fourni',
      
      // Adresse de livraison complète
      shippingAddress: customerInfo.address,
      shippingCity: customerInfo.city,
      shippingZip: customerInfo.zip,
      shippingCountry: customerInfo.country,
      
      // Détails de la commande
      orderTotal: (amount / 100).toFixed(2) + '€',
      shippingCost: '6.99€',
      itemCount: cart.reduce((total, item) => total + item.quantity, 0),
      
      // Résumé des articles (pour affichage rapide)
      orderSummary: cart.map(item => 
        `${item.name} (${item.size}, ${item.color}) x${item.quantity}`
      ).join(' | '),
      
      // Date de commande
      orderDate: new Date().toISOString(),
      
      // Statut de livraison
      shippingStatus: 'En attente de préparation',
    };

    // Ajouter les détails de chaque article individuellement
    cart.forEach((item, index) => {
      const prefix = `item${index + 1}`;
      metadata[`${prefix}_name`] = item.name;
      metadata[`${prefix}_size`] = item.size;
      metadata[`${prefix}_color`] = item.color;
      metadata[`${prefix}_quantity`] = item.quantity.toString();
      metadata[`${prefix}_price`] = (item.price * item.quantity).toFixed(2) + '€';
      metadata[`${prefix}_image`] = item.image;
    });

    // Création du PaymentIntent avec les méthodes de paiement automatiques activées
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // montant en centimes
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      metadata: metadata,
      // Ajouter des informations de facturation pour le dashboard Stripe
      receipt_email: customerInfo.email,
      description: `Commande VertiFlow - ${customerInfo.name}`,
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
