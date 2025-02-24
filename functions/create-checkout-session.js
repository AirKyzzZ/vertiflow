const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const EmailJS = require('@emailjs/node-client').default;

exports.handler = async (event) => {
    try {
        // Vérifier les données reçues
        if (!event.body) {
            throw new Error('Données manquantes');
        }

        const { cart, customerInfo } = JSON.parse(event.body);

        // 1. Création de la session Stripe
        const lineItems = cart.map(item => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: `${item.name} (${item.size})`,
                },
                unit_amount: item.price * 100,
            },
            quantity: item.quantity,
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.URL}/success.html`,
            cancel_url: `${process.env.URL}/cancel.html`,
            metadata: {
                customerEmail: customerInfo.email,
            },
        });

        // 2. Envoi d'email avec EmailJS
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        await EmailJS.send(
            process.env.EMAILJS_SERVICE_ID,
            process.env.EMAILJS_TEMPLATE_ID,
            {
                name: customerInfo.name,
                email: customerInfo.email,
                address: customerInfo.address,
                cartItems: cart.map(item => 
                    `${item.name} (${item.size}) x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`
                ).join('\n'),
                total: `$${total.toFixed(2)}`
            },
            {
                publicKey: process.env.EMAILJS_PUBLIC_KEY,
                privateKey: process.env.EMAILJS_PRIVATE_KEY
            }
        );

        return {
            statusCode: 200,
            body: JSON.stringify({ id: session.id })
        };

    } catch (error) {
        console.error('Erreur:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};