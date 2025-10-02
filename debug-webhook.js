#!/usr/bin/env node

/**
 * Webhook Debug Script
 * Helps debug webhook issues
 */

const https = require('https');
const crypto = require('crypto');

// Configuration
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_key';

console.log('🔍 Debugging webhook setup...');
console.log(`📡 Webhook URL: ${WEBHOOK_URL}`);
console.log(`🔑 Paystack Secret Key: ${PAYSTACK_SECRET_KEY ? 'Set' : 'Not set'}`);
console.log('');

// Test data
const testPayload = {
	event: 'transfer.success',
	data: {
		reference: 'debug_test_' + Date.now(),
		status: 'success',
		amount: 10000,
	}
};

// Generate signature
const signature = crypto
	.createHmac('sha512', PAYSTACK_SECRET_KEY)
	.update(JSON.stringify(testPayload))
	.digest('hex');

console.log('📋 Test Payload:');
console.log(JSON.stringify(testPayload, null, 2));
console.log('');
console.log('🔐 Generated Signature:');
console.log(signature);
console.log('');

// Test both paths
const paths = [
	'/api/webhook/paystack',    // Wrong path (what you're using)
	'/api/webhooks/paystack'    // Correct path
];

async function testWebhook(path) {
	return new Promise((resolve, reject) => {
		const url = new URL(WEBHOOK_URL + path);

		const options = {
			hostname: url.hostname,
			port: url.port || (url.protocol === 'https:' ? 443 : 80),
			path: url.pathname,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-paystack-signature': signature
			}
		};

		const req = (url.protocol === 'https:' ? https : require('http')).request(options, (res) => {
			let data = '';
			res.on('data', chunk => data += chunk);
			res.on('end', () => {
				try {
					const parsed = JSON.parse(data);
					resolve({
						path,
						status: res.statusCode,
						data: parsed,
						headers: res.headers
					});
				} catch (e) {
					resolve({
						path,
						status: res.statusCode,
						data: data,
						headers: res.headers
					});
				}
			});
		});

		req.on('error', reject);
		req.write(JSON.stringify(testPayload));
		req.end();
	});
}

async function runDebug() {
	console.log('🧪 Testing both webhook paths...');
	console.log('');

	for (const path of paths) {
		try {
			console.log(`Testing: ${path}`);
			const result = await testWebhook(path);

			if (result.status === 200) {
				console.log(`✅ ${path} - SUCCESS (${result.status})`);
				console.log(`   Response:`, result.data);
			} else if (result.status === 404) {
				console.log(`❌ ${path} - NOT FOUND (${result.status})`);
				console.log(`   This path doesn't exist`);
			} else {
				console.log(`⚠️  ${path} - ERROR (${result.status})`);
				console.log(`   Response:`, result.data);
			}
			console.log('');
		} catch (error) {
			console.log(`💥 ${path} - CONNECTION ERROR`);
			console.log(`   Error:`, error.message);
			console.log('');
		}
	}

	console.log('🏁 Debug complete!');
	console.log('');
	console.log('💡 Tips:');
	console.log('1. Make sure your server is running: pnpm dev');
	console.log('2. Use the correct path: /api/webhooks/paystack (with "s")');
	console.log('3. Check server logs for detailed error messages');
	console.log('4. Ensure PAYSTACK_SECRET_KEY is set in your .env file');
}

runDebug().catch(console.error);
