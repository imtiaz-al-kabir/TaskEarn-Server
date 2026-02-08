import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';
import { authenticate, requireBuyer, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, requireBuyer, async (req, res) => {
  try {
    const db = getDB();
    const { submission_id, reason } = req.body;
    const sub = await db.collection('submissions').findOne({ _id: new ObjectId(submission_id) });
    if (!sub || sub.buyer_email !== req.user.email) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    await db.collection('reports').insertOne({
      submission_id,
      reported_by: req.user.email,
      reason: reason || 'Invalid submission',
      status: 'pending',
      createdAt: new Date(),
    });
    res.status(201).json({ message: 'Report submitted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const list = await db.collection('reports').find({}).sort({ createdAt: -1 }).toArray();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
