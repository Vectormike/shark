#!/usr/bin/env node

/**
 * Webhook Testing Script
 *
 * This script helps test webhook endpoints locally using ngrok.
 *
 * Usage:
 * 1. Start server: pnpm dev
 * 2. Expose local server using ngrok: ngrok http 3000
 * 3. Update webhook URLs in Paystack/Flutterwave dashboard
 * 4. Run script to test webhook functionality
 */

const https = require('https');
const crypto = require('crypto');

// Configuration
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_key';
const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || 'FLWSECK_TEST_key';

// Test data
const testTransferData = {
	reference: 'test_transfer_' + Date.now(),
	status: 'success',
	amount: 10000,
	recipient: {
		name: 'Test Borrower',
		account_number: '1234567890',
		bank_code: '044'
	}
};

const testPaymentData = {
	reference: 'test_payment_' + Date.now(),
	status: 'success',
	amount: 1000,
	customer: {
		email: 'test@example.com'
	}
};

// Helper function to make HTTP requests
function makeRequest(url, options, data) {
	return new Promise((resolve, reject) => {
		const urlObj = new URL(url);
		const requestOptions = {
			hostname: urlObj.hostname,
			port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
			path: urlObj.pathname,
			method: options.method || 'POST',
			headers: options.headers || {}
		};

		const req = (urlObj.protocol === 'https:' ? https : require('http')).request(requestOptions, (res) => {
			let responseData = '';
			res.on('data', chunk => responseData += chunk);
			res.on('end', () => {
				try {
					const parsed = JSON.parse(responseData);
					resolve({ status: res.statusCode, data: parsed });
				} catch (e) {
					resolve({ status: res.statusCode, data: responseData });
				}
			});
		});

		req.on('error', reject);

		if (data) {
			req.write(JSON.stringify(data));
		}
		req.end();
	});
}

// Generate Paystack signature
function generatePaystackSignature(payload) {
	return crypto
		.createHmac('sha512', PAYSTACK_SECRET_KEY)
		.update(JSON.stringify(payload))
		.digest('hex');
}

// Generate Flutterwave signature
function generateFlutterwaveSignature(payload) {
	return crypto
		.createHmac('sha256', FLUTTERWAVE_SECRET_KEY)
		.update(JSON.stringify(payload))
		.digest('hex');
}

// Test Paystack webhook
async function testPaystackWebhook() {
	console.log('🧪 Testing Paystack webhook...');

	const payload = {
		event: 'transfer.success',
		data: testTransferData
	};

	const signature = generatePaystackSignature(payload);

	try {
		const response = await makeRequest(`${WEBHOOK_URL}/api/webhooks/paystack`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-paystack-signature': signature
			}
		}, payload);

		if (response.status === 200 && response.data.success) {
			console.log('✅ Paystack webhook test passed');
		} else {
			console.log('❌ Paystack webhook test failed:', response);
		}
	} catch (error) {
		console.log('❌ Paystack webhook test error:', error.message);
	}
}

// Test Flutterwave webhook
async function testFlutterwaveWebhook() {
	console.log('🧪 Testing Flutterwave webhook...');

	const payload = {
		event: 'transfer.completed',
		data: testTransferData
	};

	const signature = generateFlutterwaveSignature(payload);

	try {
		const response = await makeRequest(`${WEBHOOK_URL}/api/webhooks/flutterwave`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'verif-hash': signature
			}
		}, payload);

		if (response.status === 200 && response.data.success) {
			console.log('✅ Flutterwave webhook test passed');
		} else {
			console.log('❌ Flutterwave webhook test failed:', response);
		}
	} catch (error) {
		console.log('❌ Flutterwave webhook test error:', error.message);
	}
}

// Test invalid signature
async function testInvalidSignature() {
	console.log('🧪 Testing invalid signature rejection...');

	const payload = {
		event: 'transfer.success',
		data: testTransferData
	};

	try {
		const response = await makeRequest(`${WEBHOOK_URL}/api/webhooks/paystack`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-paystack-signature': 'invalid_signature'
			}
		}, payload);

		if (response.status === 400 && response.data.success === false) {
			console.log('✅ Invalid signature correctly rejected');
		} else {
			console.log('❌ Invalid signature test failed:', response);
		}
	} catch (error) {
		console.log('❌ Invalid signature test error:', error.message);
	}
}

// Main test runner
async function runTests() {
	console.log('🚀 Starting webhook tests...');
	console.log(`📡 Webhook URL: ${WEBHOOK_URL}`);
	console.log('');

	await testPaystackWebhook();
	await testFlutterwaveWebhook();
	await testInvalidSignature();

	console.log('');
	console.log('🏁 Webhook tests completed');
}

// Run tests if this script is executed directly
if (require.main === module) {
	runTests().catch(console.error);
}

module.exports = {
	testPaystackWebhook,
	testFlutterwaveWebhook,
	testInvalidSignature,
	runTests
};
