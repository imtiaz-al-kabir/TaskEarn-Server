import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        const db = client.db();

        console.log('--- LATEST 5 TASKS ---');
        const tasks = await db.collection('tasks').find().sort({ createdAt: -1 }).limit(5).toArray();
        tasks.forEach(t => {
            console.log(`Task: ${t.task_title}, Buyer: ${t.buyer_email}, Created: ${t.createdAt}`);
        });

        console.log('\n--- USERS MATCHING "ymmt" or "imtiaz" ---');
        const users = await db.collection('users').find({
            $or: [
                { email: /immt/i },
                { email: /imtiaz/i }
            ]
        }).toArray();
        console.log(users);

    } finally {
        await client.close();
    }
}

run().catch(console.dir);
