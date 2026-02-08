import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (admin.apps.length === 0) {
  try {
    let serviceAccount;

    // 1. Try Base64 encoded environment variable (Vercel Guide Suggestion)
    if (process.env.FB_SERVICE_KEY) {
      const decoded = Buffer.from(process.env.FB_SERVICE_KEY, "base64").toString("utf8");
      serviceAccount = JSON.parse(decoded);
    }
    // 2. Try raw JSON environment variable
    else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    }
    // 3. Try local file (development)
    else {
      try {
        const serviceAccountPath = join(__dirname, '..', 'taskearn-firebase-admin.json');
        serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
      } catch (fileErr) {
        console.warn('Firebase JSON file not found, skipping local file init.');
      }
    }

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('✓ Firebase Admin initialized successfully');
    } else {
      console.warn('⚠️ Firebase Admin NOT initialized: No credentials found (FB_SERVICE_KEY, ENV or JSON)');
    }
  } catch (e) {
    console.error('Firebase Admin init crashed:', e.message);
  }
}

export const auth = admin.apps && admin.apps.length > 0 ? admin.auth() : null;

export function verifyIdToken(token) {
  if (!auth) return Promise.reject(new Error('Firebase not configured'));
  return auth.verifyIdToken(token);
}
