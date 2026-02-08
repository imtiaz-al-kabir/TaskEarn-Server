import { Router } from 'express';
import Stripe from 'stripe';
import { getDB } from '../config/db.js';
import { authenticate, requireBuyer } from '../middleware/auth.js';

const router = Router();
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

const PACKAGES = [
  { coins: 10, price: 1 },
  { coins: 150, price: 10 },
  { coins: 500, price: 20 },
  { coins: 1000, price: 35 },
];

router.get('/packages', (req, res) => {
  res.json(PACKAGES);
});

router.post('/create-payment-intent', authenticate, requireBuyer, async (req, res) => {
  try {
    const { packageIndex } = req.body;
    const pkg = PACKAGES[Number(packageIndex)];
    if (!pkg) return res.status(400).json({ message: 'Invalid package' });
    if (!stripe) {
      return res.status(501).json({ message: 'Stripe not configured', demo: true, coins: pkg.coins, amount: pkg.price });
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount: pkg.price * 100,
      currency: 'usd',
      metadata: { userEmail: req.user.email, coins: pkg.coins.toString() },
    });
    res.json({ clientSecret: paymentIntent.client_secret, coins: pkg.coins, amount: pkg.price });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/confirm', authenticate, requireBuyer, async (req, res) => {
  try {
    const { coins, amount, paymentIntentId } = req.body;
    const db = getDB();

    // Verify Stripe payment if paymentIntentId is provided
    if (paymentIntentId && stripe) {
      console.log(`Verifying PaymentIntent: ${paymentIntentId}`);
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (intent.status !== 'succeeded') {
        return res.status(400).json({ message: 'Payment not successful. Status: ' + intent.status });
      }
      console.log('✓ PaymentIntent verified');
    }

    await db.collection('payments').insertOne({
      user_email: req.user.email,
      user_name: req.user.name,
      coins: Number(coins),
      amount: Number(amount),
      stripe_id: paymentIntentId || 'manual',
      createdAt: new Date(),
    });

    await db.collection('users').updateOne(
      { email: req.user.email },
      { $inc: { coin: Number(coins) } }
    );

    console.log(`✓ Coins added: ${coins} to ${req.user.email}`);

    res.json({ message: 'Payment confirmed' });
  } catch (err) {
    console.error('Payment Confirm Error:', err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/history', authenticate, requireBuyer, async (req, res) => {
  try {
    const db = getDB();
    const list = await db
      .collection('payments')
      .find({ user_email: req.user.email })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
