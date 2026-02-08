import { getDB } from '../config/db.js';

export async function createNotification(db, { toEmail, message, actionRoute }) {
  const col = db.collection('notifications');
  await col.insertOne({
    toEmail,
    message,
    actionRoute: actionRoute || '/dashboard',
    time: new Date(),
  });
}
