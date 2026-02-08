import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
    const keyPath = join(__dirname, 'taskearn-firebase-admin.json');
    const key = fs.readFileSync(keyPath, 'utf8');
    const base64 = Buffer.from(key).toString('base64');
    console.log('\n🚀 COPY THIS BASE64 STRING FOR FB_SERVICE_KEY:\n');
    console.log(base64);
    console.log('\n');
} catch (err) {
    console.error('❌ Error: Could not find taskearn-firebase-admin.json in the root directory.');
}
