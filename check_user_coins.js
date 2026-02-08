import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        const db = client.db();
        const user = await db.collection('users').findOne({ email: 'immt@gmail.com' });
        console.log('Current user state:');
        console.log(`Email: ${user.email}`);
        console.log(`Coins: ${user.coin}`);
        console.log(`Role: ${user.role}`);
    } finally {
        await client.close();
    }
}

run().catch(console.dir);
