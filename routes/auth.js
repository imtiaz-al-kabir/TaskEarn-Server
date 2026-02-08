import { Router } from 'express';
import { getDB } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/me', authenticate, async (req, res) => {
  try {
    const db = getDB();
    const freshUser = await db.collection('users').findOne({ email: req.user.email });
    if (!freshUser) return res.status(404).json({ message: 'User not found' });
    const { _id, ...user } = freshUser;
    res.json({ ...user, role: user.role?.toLowerCase() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
