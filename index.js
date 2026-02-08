import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB, getDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import taskRoutes from './routes/tasks.js';
import submissionRoutes from './routes/submissions.js';
import withdrawalRoutes from './routes/withdrawals.js';
import paymentRoutes from './routes/payments.js';
import notificationRoutes from './routes/notifications.js';
import reportRoutes from './routes/reports.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://task-earn-pro.web.app", // Added common platform domains
      "https://task-earn-pro.firebaseapp.com",
    ],
    credentials: true,
  })
);

app.use(express.json());

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};

// Lazy DB Connection Middleware
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection middleware error:', err.message);
    if (req.path === '/api/health') {
      return res.json({ ok: false, db: false, error: err.message });
    }
    res.status(503).json({
      message: 'Service Unavailable: Database connection failed.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true, db: !!getDB() }));

// Export app for serverless deployment
export { app };

if (process.env.NODE_ENV !== 'production' || (!process.env.NETLIFY && !process.env.VERCEL)) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
