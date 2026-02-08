import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';
import { authenticate, requireBuyer, requireWorker } from '../middleware/auth.js';
import { createNotification } from '../lib/notifications.js';
import { sendEmailNotification } from '../lib/email.js';

const router = Router();

router.post('/', authenticate, requireWorker, async (req, res) => {
  try {
    const db = getDB();
    const { task_id, submission_details } = req.body;
    const task = await db.collection('tasks').findOne({ _id: new ObjectId(task_id) });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.required_workers <= 0) return res.status(400).json({ message: 'Task is full' });
    const existing = await db.collection('submissions').findOne({
      task_id: task_id.toString(),
      worker_email: req.user.email,
    });
    if (existing) return res.status(400).json({ message: 'Already submitted' });
    const sub = {
      task_id: task_id.toString(),
      task_title: task.task_title,
      payable_amount: task.payable_amount,
      worker_email: req.user.email,
      worker_name: req.user.name,
      submission_details,
      buyer_name: task.buyer_name,
      buyer_email: task.buyer_email,
      status: 'pending',
      createdAt: new Date(),
    };
    const { insertedId } = await db.collection('submissions').insertOne(sub);
    await db.collection('tasks').updateOne(
      { _id: new ObjectId(task_id) },
      { $inc: { required_workers: -1 } }
    );
    await createNotification(db, {
      toEmail: task.buyer_email,
      message: `${req.user.name} submitted for task "${task.task_title}". Payable: ${task.payable_amount} coins.`,
      actionRoute: '/dashboard/tasks-to-review',
    });
    await sendEmailNotification(task.buyer_email, 'New submission', `${req.user.name} submitted for task "${task.task_title}".`);
    res.status(201).json({ _id: insertedId, ...sub });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/worker/mine', authenticate, requireWorker, async (req, res) => {
  try {
    const db = getDB();
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(20, Math.max(5, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const [submissions, total] = await Promise.all([
      db.collection('submissions')
        .find({ worker_email: req.user.email })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('submissions').countDocuments({ worker_email: req.user.email }),
    ]);
    res.json({ submissions, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/worker/approved', authenticate, requireWorker, async (req, res) => {
  try {
    const db = getDB();
    const list = await db
      .collection('submissions')
      .find({ worker_email: req.user.email, status: 'approved' })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/buyer/pending', authenticate, requireBuyer, async (req, res) => {
  try {
    const db = getDB();
    const list = await db
      .collection('submissions')
      .find({ buyer_email: req.user.email, status: 'pending' })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/approve', authenticate, requireBuyer, async (req, res) => {
  try {
    const db = getDB();
    const sub = await db.collection('submissions').findOne({
      _id: new ObjectId(req.params.id),
      buyer_email: req.user.email,
      status: 'pending',
    });
    if (!sub) return res.status(404).json({ message: 'Submission not found' });
    await db.collection('submissions').updateOne(
      { _id: sub._id },
      { $set: { status: 'approved', updatedAt: new Date() } }
    );
    await db.collection('users').updateOne(
      { email: sub.worker_email },
      { $inc: { coin: sub.payable_amount } }
    );
    await createNotification(db, {
      toEmail: sub.worker_email,
      message: `You have earned ${sub.payable_amount} coins from ${sub.buyer_name} for completing "${sub.task_title}".`,
      actionRoute: '/dashboard/worker-home',
    });
    await sendEmailNotification(sub.worker_email, 'Task approved', `You earned ${sub.payable_amount} coins for "${sub.task_title}".`);
    res.json({ message: 'Approved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/reject', authenticate, requireBuyer, async (req, res) => {
  try {
    const db = getDB();
    const sub = await db.collection('submissions').findOne({
      _id: new ObjectId(req.params.id),
      buyer_email: req.user.email,
      status: 'pending',
    });
    if (!sub) return res.status(404).json({ message: 'Submission not found' });
    await db.collection('submissions').updateOne(
      { _id: sub._id },
      { $set: { status: 'rejected', updatedAt: new Date() } }
    );
    await db.collection('tasks').updateOne(
      { _id: new ObjectId(sub.task_id) },
      { $inc: { required_workers: 1 } }
    );
    await createNotification(db, {
      toEmail: sub.worker_email,
      message: `Your submission for "${sub.task_title}" was rejected by ${sub.buyer_name}.`,
      actionRoute: '/dashboard/my-submissions',
    });
    res.json({ message: 'Rejected' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/worker/stats', authenticate, requireWorker, async (req, res) => {
  try {
    const db = getDB();
    const email = req.user.email;
    const [totalSubs, pendingSubs, approved] = await Promise.all([
      db.collection('submissions').countDocuments({ worker_email: email }),
      db.collection('submissions').countDocuments({ worker_email: email, status: 'pending' }),
      db.collection('submissions').aggregate([
        { $match: { worker_email: email, status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$payable_amount' } } },
      ]).toArray(),
    ]);
    res.json({
      totalSubmissions: totalSubs,
      pendingSubmissions: pendingSubs,
      totalEarning: approved[0]?.total ?? 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
