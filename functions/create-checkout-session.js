const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const emailjs = require('emailjs-com'); // Ajoutez cette ligne

exports.handler = async (event) => {
    const { cart, customerInfo } = JSON.parse(event.body);

    const lineItems = cart.map(item => ({
        price_data: {
            currency: 'usd',
            product_data: {
                name: `${item.name} (${item.size})`,
            },
            unit_amount: item.price * 100, // Stripe utilise des cents
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
            cart: JSON.stringify(cart),
        },
    });

    // Envoyer un email via EmailJS
    const emailData = {
        name: customerInfo.name,
        email: customerInfo.email,
        address: customerInfo.address,
        cartItems: cart.map(item => 
            `${item.name} (Taille: ${item.size}, Quantité: ${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}`
        ).join('<br>'),
        total: `$${cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}`,
    };

    await emailjs.send(
        process.env.EMAILJS_SERVICE_ID, // Service ID
        process.env.EMAILJS_TEMPLATE_ID, // Template ID
        emailData,
        process.env.EMAILJS_USER_ID // User ID
    );

    return {
        statusCode: 200,
        body: JSON.stringify({ id: session.id }),
    };
};