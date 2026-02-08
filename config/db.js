import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
let client;
let db;

export async function connectDB() {
  if (db) return db;
  if (!uri) throw new Error('MONGODB_URI is not set');
  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db();
    return db;
  } catch (err) {
    console.error('DB Connection error:', err.message);
    throw err;
  }
}

export function getDB() {
  return db;
}

export async function closeDB() {
  if (client) await client.close();
}
