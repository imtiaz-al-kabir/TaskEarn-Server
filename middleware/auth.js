import { getDB } from '../config/db.js';
import { verifyIdToken } from '../config/firebase.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access token required' });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = await verifyIdToken(token);
    } catch (err) {
      if (err.message.includes('configured')) {
        console.warn('Firebase Admin not configured. Using insecure token decoding.');
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
        decoded = JSON.parse(jsonPayload);
      } else {
        throw err;
      }
    }
    req.uid = decoded.user_id || decoded.uid;
    req.userEmail = decoded.email;

    console.log(`Auth Middleware: Decoded email: ${decoded.email}`);

    const db = getDB();
    // Case-insensitive login
    let user = await db.collection('users').findOne({ email: decoded.email });
    if (!user) {
      console.log(`Auth Middleware: Exact match failed for ${decoded.email}, trying case-insensitive...`);
      user = await db.collection('users').findOne({ email: { $regex: new RegExp(`^${decoded.email}$`, 'i') } });
    }

    if (!user) {
      console.warn(`Auth Middleware: User not found for email ${decoded.email}`);
      return res.status(404).json({ message: 'User not found' });
    }

    req.user = { ...user, role: user.role?.toLowerCase() };
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    next();
  };
}

export const requireWorker = requireRole('worker');
export const requireBuyer = requireRole('buyer');
export const requireAdmin = requireRole('admin');
