const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Stripe secret key
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const endpointSecret = process.env.STRIPE_SIGNING_SECRET; // Stripe webhook signing secret
const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL; // Discord webhook URL

app.use(bodyParser.raw({ type: 'application/json' }));

app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const message = {
      content: `✅ **Payment Received!**\nAmount: $${(paymentIntent.amount / 100).toFixed(2)}\nCustomer Email: ${paymentIntent.receipt_email || 'N/A'}`,
    };

    try {
      await axios.post(discordWebhookUrl, message);
      console.log('Notification sent to Discord!');
    } catch (error) {
      console.error('Error sending message to Discord:', error);
    }
  }

  res.status(200).json({ received: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
