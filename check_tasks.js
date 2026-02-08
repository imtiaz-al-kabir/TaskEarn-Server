import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        const db = client.db();
        const tasks = await db.collection('tasks').find({ buyer_email: 'immt@gmail.com' }).toArray();
        console.log('Tasks found:', tasks);
    } finally {
        await client.close();
    }
}

run().catch(console.dir);
