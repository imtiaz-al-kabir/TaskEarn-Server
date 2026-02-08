# Micro Task Server (TaskEarn – Express Backend)

**Standalone Express.js application** – API backend for the TaskEarn micro-tasking platform. This is a separate application from the client.

## Tech Stack

- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Firebase Admin SDK** - Token verification
- **Stripe** - Payment processing (optional)
- **SendGrid** - Email notifications (optional)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   ```bash
   cp env-example.txt .env
   ```
   **Private keys and secrets go in `.env`** – this file is gitignored and must never be committed. Then fill in:
   ```env
   PORT=5000
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname?retryWrites=true&w=majority
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   STRIPE_SECRET_KEY=sk_test_xxx
   SENDGRID_API_KEY=SG.xxx
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   IMGBB_API_KEY=your-imgbb-key
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Run production server:**
   ```bash
   npm start
   ```

## Project Structure

```
micro-task-server/
├── config/
│   ├── db.js           # MongoDB connection
│   └── firebase.js     # Firebase Admin setup
├── middleware/
│   └── auth.js         # Authentication & authorization middleware
├── routes/
│   ├── auth.js         # Auth routes (/auth/me)
│   ├── users.js        # User management
│   ├── tasks.js        # Task CRUD
│   ├── submissions.js  # Submission management
│   ├── withdrawals.js  # Withdrawal requests
│   ├── payments.js     # Payment processing
│   ├── notifications.js # Notifications
│   └── reports.js      # Reports
├── lib/
│   ├── notifications.js # Notification creation
│   └── email.js        # Email sending (SendGrid)
├── index.js            # Entry point
├── package.json
└── env-example.txt     # Environment variables template
```

## API Routes

### Authentication
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/top-workers` - Get top 6 workers by coins
- `GET /api/users` - Get all users (Admin)
- `GET /api/users/stats` - Get platform stats (Admin)
- `PATCH /api/users/:email/role` - Update user role (Admin)
- `DELETE /api/users/:email` - Delete user (Admin)
- `POST /api/users/register-db` - Register user in DB

### Tasks
- `GET /api/tasks` - Get tasks (with search/filter)
- `GET /api/tasks/:id` - Get task details
- `POST /api/tasks` - Create task (Buyer)
- `GET /api/tasks/buyer/stats` - Get buyer stats
- `GET /api/tasks/buyer/mine` - Get buyer's tasks
- `PATCH /api/tasks/:id` - Update task (Buyer)
- `DELETE /api/tasks/:id` - Delete task (Buyer/Admin)
- `GET /api/tasks/admin/all` - Get all tasks (Admin)

### Submissions
- `POST /api/submissions` - Create submission (Worker)
- `GET /api/submissions/worker/mine` - Get worker's submissions (paginated)
- `GET /api/submissions/worker/approved` - Get approved submissions
- `GET /api/submissions/worker/stats` - Get worker stats
- `GET /api/submissions/buyer/pending` - Get pending submissions (Buyer)
- `POST /api/submissions/:id/approve` - Approve submission (Buyer)
- `POST /api/submissions/:id/reject` - Reject submission (Buyer)

### Withdrawals
- `POST /api/withdrawals` - Create withdrawal request (Worker)
- `GET /api/withdrawals/worker/mine` - Get worker's withdrawals
- `GET /api/withdrawals/admin/pending` - Get pending withdrawals (Admin)
- `POST /api/withdrawals/:id/approve` - Approve withdrawal (Admin)

### Payments
- `GET /api/payments/packages` - Get coin packages
- `POST /api/payments/create-payment-intent` - Create Stripe payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/history` - Get payment history (Buyer)

### Notifications
- `GET /api/notifications` - Get user notifications

### Reports
- `POST /api/reports` - Create report (Buyer)
- `GET /api/reports` - Get all reports (Admin)

## Middleware

- `authenticate` - Verify Firebase ID token
- `requireWorker` - Require worker role
- `requireBuyer` - Require buyer role
- `requireAdmin` - Require admin role

## Database Collections

- `users` - User accounts
- `tasks` - Tasks created by buyers
- `submissions` - Worker submissions
- `withdrawals` - Withdrawal requests
- `payments` - Payment history
- `notifications` - User notifications
- `reports` - Reports on invalid submissions

---

*Deploy this API and set CORS to allow your micro-task-client origin. Client will call this API using `VITE_API_URL`.*
# TaskEarn-Server
