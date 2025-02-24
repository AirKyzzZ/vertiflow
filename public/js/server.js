require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint pour créer une session de paiement
app.post('/create-checkout-session', async (req, res) => {
    const { cart, customerInfo } = req.body;

    const lineItems = cart.map(item => ({
        price_data: {
            currency: 'usd',
            product_data: {
                name: `${item.name} (${item.size})`,
            },
            unit_amount: item.price * 100, // Stripe nécessite des cents
        },
        quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${process.env.CLIENT_URL}/success.html`,
        cancel_url: `${process.env.CLIENT_URL}/cancel.html`,
        metadata: {
            customerEmail: customerInfo.email,
            cart: JSON.stringify(cart)
        }
    });

    res.json({ id: session.id });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));