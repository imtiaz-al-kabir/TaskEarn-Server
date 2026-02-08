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
      "https://micro-task-project.web.app",
      "https://micro-task-project.firebaseapp.com",
      "https://career-portal-ph.web.app",
      "https://career-portal-ph.firebaseapp.com",
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

app.get('/', (req, res) => {
  res.send('Micro Task Server is running! 🚀');
});

app.get('/api/health', (req, res) => res.json({
  ok: true,
  env: process.env.NODE_ENV,
  vercel: !!process.env.VERCEL
}));

app.get('/api/debug-vars', (req, res) => {
  res.json({
    hasMongo: !!process.env.MONGODB_URI,
    hasFirebaseKey: !!process.env.FB_SERVICE_KEY,
    hasStripe: !!process.env.STRIPE_SECRET_KEY,
    hasImgBB: !!process.env.IMGBB_API_KEY
  });
});

// Lazy DB Connection Middleware
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection middleware error:', err.message);
    res.status(503).json({
      message: 'Service Unavailable: Database connection failed.',
      error: err.message
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

app.get('/api/db-status', (req, res) => res.json({ connected: !!getDB() }));

// Export app for serverless deployment
export default app;

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
