import { Router } from 'express';
import { getDB } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const db = getDB();
    const list = await db
      .collection('notifications')
      .find({ toEmail: req.user.email })
      .sort({ time: -1 })
      .limit(50)
      .toArray();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
