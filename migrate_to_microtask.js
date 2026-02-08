import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function migrate() {
    try {
        await client.connect();

        // Connect to both databases
        const testDb = client.db('test');
        const microtaskDb = client.db('microtask');

        console.log('=== MIGRATION STARTED ===\n');

        // Migrate users
        console.log('Migrating users...');
        const users = await testDb.collection('users').find().toArray();
        if (users.length > 0) {
            await microtaskDb.collection('users').deleteMany({}); // Clear existing
            await microtaskDb.collection('users').insertMany(users);
            console.log(`✓ Migrated ${users.length} users`);
        } else {
            console.log('No users to migrate');
        }

        // Migrate tasks
        console.log('Migrating tasks...');
        const tasks = await testDb.collection('tasks').find().toArray();
        if (tasks.length > 0) {
            await microtaskDb.collection('tasks').deleteMany({}); // Clear existing
            await microtaskDb.collection('tasks').insertMany(tasks);
            console.log(`✓ Migrated ${tasks.length} tasks`);
        } else {
            console.log('No tasks to migrate');
        }

        console.log('\n=== MIGRATION COMPLETED ===');
        console.log('\nVerifying microtask database:');
        const userCount = await microtaskDb.collection('users').countDocuments();
        const taskCount = await microtaskDb.collection('tasks').countDocuments();
        console.log(`Users: ${userCount}`);
        console.log(`Tasks: ${taskCount}`);

    } finally {
        await client.close();
    }
}

migrate().catch(console.error);
