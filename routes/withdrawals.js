import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';
import { authenticate, requireWorker, requireAdmin } from '../middleware/auth.js';
import { createNotification } from '../lib/notifications.js';
import { sendEmailNotification } from '../lib/email.js';

const router = Router();
const COINS_PER_DOLLAR = 20;
const MIN_WITHDRAW_COINS = 200;

router.post('/', authenticate, requireWorker, async (req, res) => {
  try {
    const db = getDB();
    const { withdrawal_coin, payment_system, account_number } = req.body;
    const coin = Number(withdrawal_coin);
    if (coin < MIN_WITHDRAW_COINS) {
      return res.status(400).json({ message: `Minimum withdrawal is ${MIN_WITHDRAW_COINS} coins` });
    }
    const user = req.user;
    if (user.coin < coin) {
      return res.status(400).json({ message: 'Insufficient coins' });
    }
    const withdrawal_amount = coin / COINS_PER_DOLLAR;
    const doc = {
      worker_email: user.email,
      worker_name: user.name,
      withdrawal_coin: coin,
      withdrawal_amount,
      payment_system: payment_system || 'Stripe',
      account_number: account_number || '',
      withdraw_date: new Date(),
      status: 'pending',
    };
    await db.collection('withdrawals').insertOne(doc);
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/worker/mine', authenticate, requireWorker, async (req, res) => {
  try {
    const db = getDB();
    const list = await db
      .collection('withdrawals')
      .find({ worker_email: req.user.email })
      .sort({ withdraw_date: -1 })
      .toArray();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/admin/pending', authenticate, requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const list = await db
      .collection('withdrawals')
      .find({ status: 'pending' })
      .sort({ withdraw_date: -1 })
      .toArray();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/approve', authenticate, requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const w = await db.collection('withdrawals').findOne({
      _id: new ObjectId(req.params.id),
      status: 'pending',
    });
    if (!w) return res.status(404).json({ message: 'Withdrawal not found' });
    const user = await db.collection('users').findOne({ email: w.worker_email });
    if (!user || user.coin < w.withdrawal_coin) {
      return res.status(400).json({ message: 'User has insufficient coins' });
    }
    await db.collection('withdrawals').updateOne(
      { _id: w._id },
      { $set: { status: 'approved', updatedAt: new Date() } }
    );
    await db.collection('users').updateOne(
      { email: w.worker_email },
      { $inc: { coin: -w.withdrawal_coin } }
    );
    await createNotification(db, {
      toEmail: w.worker_email,
      message: `Your withdrawal of $${w.withdrawal_amount} has been approved and processed.`,
      actionRoute: '/dashboard/withdrawals',
    });
    await sendEmailNotification(w.worker_email, 'Withdrawal approved', `Your withdrawal of $${w.withdrawal_amount} was successful.`);
    res.json({ message: 'Payment success' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
