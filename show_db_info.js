import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
console.log('MongoDB URI:', uri);

const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        const db = client.db();
        console.log('\n=== DATABASE INFO ===');
        console.log('Database Name:', db.databaseName);

        const collections = await db.listCollections().toArray();
        console.log('\n=== COLLECTIONS ===');
        collections.forEach(c => console.log(`- ${c.name}`));

        console.log('\n=== TASKS COLLECTION ===');
        const taskCount = await db.collection('tasks').countDocuments();
        console.log(`Total tasks: ${taskCount}`);

        const tasks = await db.collection('tasks').find().limit(3).toArray();
        tasks.forEach(t => {
            console.log(`\nTask: ${t.task_title}`);
            console.log(`  Buyer: ${t.buyer_email}`);
            console.log(`  ID: ${t._id}`);
        });

        console.log('\n=== USERS COLLECTION ===');
        const userCount = await db.collection('users').countDocuments();
        console.log(`Total users: ${userCount}`);

    } finally {
        await client.close();
    }
}

run().catch(console.dir);
