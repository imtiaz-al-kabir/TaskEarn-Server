import 'dotenv/config';
import axios from 'axios';

const PORT = process.env.PORT || 5000;
const API_URL = `http://localhost:${PORT}/api`;

// Create a fake token payload
const payload = JSON.stringify({
    email: 'immt@gmail.com',
    user_id: 'test_uid_123'
});

// Encode to base64 (simple mapping for the insecure middleware to decode)
// The middleware expects: header.payload.signature
// And it decodes the payload part
const base64Payload = Buffer.from(payload).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const fakeToken = `Bearer fake.${base64Payload}.fake`;

async function run() {
    try {
        console.log('Testing Task Creation...');
        const taskData = {
            task_title: 'Test Task from Script',
            task_detail: 'This is a test task to verify the API',
            required_workers: 1,
            payable_amount: 1,
            completion_date: new Date(Date.now() + 86400000).toISOString(),
            submission_info: 'Submit a screenshot',
            task_image_url: 'https://example.com/image.png'
        };

        const res = await axios.post(`${API_URL}/tasks`, taskData, {
            headers: { Authorization: fakeToken }
        });

        console.log('Task Creation Status:', res.status);
        console.log('Task Created:', res.data);

    } catch (err) {
        console.error('Task Creation Failed:', err.response?.data || err.message);
    }
}

run();
