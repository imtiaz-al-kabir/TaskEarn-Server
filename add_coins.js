import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        const db = client.db();

        console.log('Updating coin balance for immt@gmail.com...');

        const result = await db.collection('users').updateOne(
            { email: 'immt@gmail.com' },
            { $set: { coin: 10000 } }
        );

        if (result.modifiedCount > 0) {
            console.log('✓ Successfully updated coin balance to 10,000');

            const user = await db.collection('users').findOne({ email: 'immt@gmail.com' });
            console.log('\nCurrent balance:', user.coin, 'coins');
        } else {
            console.log('✗ Failed to update');
        }

    } finally {
        await client.close();
    }
}

run().catch(console.dir);
