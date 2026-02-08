import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';
import { authenticate, requireBuyer, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const { search, deadline, rewardMin, rewardMax, status, page = 1, limit = 12 } = req.query;
    const filter = { required_workers: { $gt: 0 } };
    if (search) filter.$or = [
      { task_title: new RegExp(search, 'i') },
      { task_detail: new RegExp(search, 'i') },
    ];
    if (deadline) filter.completion_date = { $gte: new Date(deadline) };
    if (rewardMin != null || rewardMax != null) {
      filter.payable_amount = {};
      if (rewardMin != null) filter.payable_amount.$gte = Number(rewardMin);
      if (rewardMax != null) filter.payable_amount.$lte = Number(rewardMax);
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [tasks, total] = await Promise.all([
      db.collection('tasks').find(filter).sort({ completion_date: -1 }).skip(skip).limit(Number(limit)).toArray(),
      db.collection('tasks').countDocuments(filter),
    ]);
    res.json({ tasks, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid ID' });
    const task = await db.collection('tasks').findOne({ _id: new ObjectId(req.params.id) });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', authenticate, requireBuyer, async (req, res) => {
  try {
    const db = getDB();
    const user = req.user;
    console.log(`Task Create: Request from ${user.email} (${user.role})`);
    const {
      task_title, task_detail, required_workers, payable_amount,
      completion_date, submission_info, task_image_url,
    } = req.body;
    const totalPayable = required_workers * payable_amount;
    console.log(`Task Create: Pay ${totalPayable}, User Balance ${user.coin}`);
    if (user.coin < totalPayable) {
      console.warn('Task Create: Insufficient funds');
      return res.status(400).json({ message: 'Not enough coins. Purchase coins first.' });
    }
    const task = {
      task_title,
      task_detail,
      required_workers: Number(required_workers),
      payable_amount: Number(payable_amount),
      completion_date: new Date(completion_date),
      submission_info,
      task_image_url: task_image_url || '',
      buyer_email: user.email,
      buyer_name: user.name,
      createdAt: new Date(),
    };
    const { insertedId } = await db.collection('tasks').insertOne(task);
    await db.collection('users').updateOne(
      { email: user.email },
      { $inc: { coin: -totalPayable } }
    );
    res.status(201).json({ _id: insertedId, ...task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/buyer/stats', authenticate, requireBuyer, async (req, res) => {
  try {
    const db = getDB();
    const email = req.user.email;
    const tasks = await db.collection('tasks').find({ buyer_email: email }).toArray();
    const totalTasks = tasks.length;
    const pendingWorkers = tasks.reduce((s, t) => s + (t.required_workers || 0), 0);
    const payments = await db.collection('payments').aggregate([
      { $match: { user_email: email } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).toArray();
    res.json({
      totalTasks,
      pendingWorkers,
      totalPayment: payments[0]?.total ?? 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/buyer/mine', authenticate, requireBuyer, async (req, res) => {
  try {
    const db = getDB();
    const email = req.user.email;
    console.log(`Task Fetch Mine: Fetching for ${email}`);
    const tasks = await db
      .collection('tasks')
      .find({ buyer_email: email })
      .sort({ completion_date: -1 })
      .toArray();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id', authenticate, requireBuyer, async (req, res) => {
  try {
    const db = getDB();
    const { task_title, task_detail, submission_info } = req.body;
    const task = await db.collection('tasks').findOne({
      _id: new ObjectId(req.params.id),
      buyer_email: req.user.email,
    });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    await db.collection('tasks').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { task_title, task_detail, submission_info, updatedAt: new Date() } }
    );
    res.json({ message: 'Task updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const db = getDB();
    const task = await db.collection('tasks').findOne({ _id: new ObjectId(req.params.id) });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const isBuyer = task.buyer_email === req.user.email;
    const isAdmin = req.user.role === 'admin';
    if (!isBuyer && !isAdmin) return res.status(403).json({ message: 'Forbidden' });
    const refill = task.required_workers * task.payable_amount;
    if (isBuyer) {
      await db.collection('users').updateOne(
        { email: req.user.email },
        { $inc: { coin: refill } }
      );
    }
    await db.collection('tasks').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/admin/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const tasks = await db.collection('tasks').find({}).sort({ createdAt: -1 }).toArray();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
