import 'dotenv/config';
import axios from 'axios';

const PORT = process.env.PORT || 5000;
const API_URL = `http://localhost:${PORT}/api`;

// Create a fake token payload
const payload = JSON.stringify({
    email: 'immt@gmail.com',
    user_id: 'test_uid_123'
});

const base64Payload = Buffer.from(payload).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const fakeToken = `Bearer fake.${base64Payload}.fake`;

async function run() {
    try {
        console.log('Testing Task Creation with 1 worker, 1 coin...');
        const taskData = {
            task_title: 'Simple Test Task',
            task_detail: 'Testing with minimal coins',
            required_workers: 1,
            payable_amount: 1,
            completion_date: new Date(Date.now() + 86400000).toISOString(),
            submission_info: 'Submit a screenshot',
            task_image_url: ''
        };

        const res = await axios.post(`${API_URL}/tasks`, taskData, {
            headers: { Authorization: fakeToken }
        });

        console.log('✓ Task Created Successfully!');
        console.log('Task ID:', res.data._id);
        console.log('Coins deducted: 1');

    } catch (err) {
        console.error('✗ Task Creation Failed');
        console.error('Status:', err.response?.status);
        console.error('Error:', err.response?.data?.message || err.message);
    }
}

run();
