import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        const db = client.db();

        console.log('Database:', db.databaseName);
        const user = await db.collection('users').findOne({ email: 'immt@gmail.com' });

        if (user) {
            console.log('\nUser:', user.email);
            console.log('Coins:', user.coin);
            console.log('Role:', user.role);
        } else {
            console.log('User not found!');
        }

    } finally {
        await client.close();
    }
}

run().catch(console.dir);
