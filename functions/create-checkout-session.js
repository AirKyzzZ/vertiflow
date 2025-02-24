const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const EmailJS = require('@emailjs/browser');

exports.handler = async (event) => {
    // testing public

    // Envoi d'email avec EmailJS
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
            publicKey: process.env.EMAILJS_USER_ID
        }
    );

    return { statusCode: 200, body: JSON.stringify({ id: session.id }) };
};