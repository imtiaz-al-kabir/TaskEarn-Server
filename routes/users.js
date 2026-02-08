import { Router } from 'express';
import { getDB } from '../config/db.js';
import { authenticate, requireAdmin, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/top-workers', async (req, res) => {
  try {
    const db = getDB();
    const workers = await db
      .collection('users')
      .find({ role: 'worker' })
      .sort({ coin: -1 })
      .limit(6)
      .project({ name: 1, email: 1, photoURL: 1, coin: 1 })
      .toArray();
    res.json(workers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const users = await db.collection('users').find({}).toArray();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:email/role', authenticate, requireAdmin, async (req, res) => {
  try {
    const { email } = req.params;
    const { role } = req.body;
    if (!['admin', 'buyer', 'worker'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const db = getDB();
    const result = await db.collection('users').updateOne(
      { email },
      { $set: { role } }
    );
    if (!result.matchedCount) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Role updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:email', authenticate, requireAdmin, async (req, res) => {
  try {
    const { email } = req.params;
    const db = getDB();
    const result = await db.collection('users').deleteOne({ email });
    if (!result.deletedCount) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/register-db', async (req, res) => {
  try {
    const { email, name, photoURL, role } = req.body;
    const db = getDB();
    const existing = await db.collection('users').findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });
    const coin = role === 'worker' ? 10 : role === 'buyer' ? 50 : 0;
    await db.collection('users').insertOne({
      email,
      name: name || 'User',
      photoURL: photoURL || '',
      role: role || 'worker',
      coin,
      createdAt: new Date(),
    });
    res.status(201).json({ message: 'User created', coin });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const [workers, buyers, users] = await Promise.all([
      db.collection('users').countDocuments({ role: 'worker' }),
      db.collection('users').countDocuments({ role: 'buyer' }),
      db.collection('users').aggregate([{ $group: { _id: null, total: { $sum: '$coin' } } }]).toArray(),
    ]);
    const payments = await db.collection('payments').aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).toArray();
    res.json({
      totalWorkers: workers,
      totalBuyers: buyers,
      totalCoins: users[0]?.total ?? 0,
      totalPayments: payments[0]?.total ?? 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

