import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        const db = client.db();

        // Check if user exists first
        const existing = await db.collection('users').findOne({ email: 'immt@gmail.com' });
        if (existing) {
            console.log('User already exists:', existing);
            if (!existing.role) {
                await db.collection('users').updateOne(
                    { email: 'immt@gmail.com' },
                    { $set: { role: 'worker' } }
                );
                console.log('Updated existing user with role: worker');
            }
        } else {
            // Insert new user
            const result = await db.collection('users').insertOne({
                email: 'immt@gmail.com',
                name: 'immt',
                photoURL: null, // Use null as seen in debug output
                role: 'worker', // Default role for missing users
                coin: 10,      // Default coin for worker
                createdAt: new Date()
            });
            console.log('Inserted missing user:', result);
        }

    } finally {
        await client.close();
    }
}

run().catch(console.dir);
