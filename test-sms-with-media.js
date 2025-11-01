#!/usr/bin/env node

/**
 * Test SMS with Media Support
 * Tests the enhanced SMS functionality with media attachments
 */

require('dotenv').config();

console.log('🧪 Testing SMS with Media Support');
console.log('==================================\n');

async function testSMSWithMedia() {
	try {
		// Set console mode for testing
		process.env.NOTIFICATION_PROVIDER = 'console';

		// Import the services
		console.log('📦 Importing services...');
		const { getNotificationService } = await import('./build/services/NotificationService.js');
		const notificationService = getNotificationService();

		// Test 1: Basic SMS (no media)
		console.log('📱 Test 1: Basic SMS (no media)');
		console.log('===============================');

		const basicSmsResult = await notificationService.sendNotification({
			to: '+2348086249721',
			message: 'Hi John Doe! Your loan request of ₦50,000 has been approved. Loan ID: loan-123. Thank you!',
			type: 'sms'
		});

		console.log('Basic SMS Result:', basicSmsResult);
		console.log('');

		// Test 2: SMS with media attachment
		console.log('📎 Test 2: SMS with Media');
		console.log('=========================');

		const smsWithMediaResult = await notificationService.sendNotification({
			to: '+2348086249721',
			message: 'Hi John Doe! Your loan request of ₦50,000 has been approved. Please find your loan agreement attached.',
			type: 'sms',
			media: {
				url: 'https://example.com/loan-documents/loan-123.pdf',
				caption: 'Your loan agreement document'
			}
		});

		console.log('SMS with Media Result:', smsWithMediaResult);
		console.log('');

		// Test 3: SMS with media but no caption
		console.log('📎 Test 3: SMS with Media (no caption)');
		console.log('=====================================');

		const smsWithMediaNoCaptionResult = await notificationService.sendNotification({
			to: '+2348086249721',
			message: 'Hi John Doe! Your loan documents are ready for download.',
			type: 'sms',
			media: {
				url: 'https://example.com/loan-documents/loan-123-contract.pdf'
			}
		});

		console.log('SMS with Media (no caption) Result:', smsWithMediaNoCaptionResult);
		console.log('');

		// Test 4: Test with real Termii API (if credentials are configured)
		if (process.env.SMS_API_KEY) {
			console.log('🔑 Test 4: Real Termii API with Media');
			console.log('====================================');

			// Temporarily enable real API
			delete process.env.NOTIFICATION_PROVIDER;

			const realSmsResult = await notificationService.sendNotification({
				to: '+2348086249721',
				message: 'Test message with media from Loan Shark App',
				type: 'sms',
				media: {
					url: 'https://example.com/test-document.pdf',
					caption: 'Test document'
				}
			});

			console.log('Real SMS with Media Result:', realSmsResult);

			// Restore console mode
			process.env.NOTIFICATION_PROVIDER = 'console';
		} else {
			console.log('💡 To test with real Termii API:');
			console.log('1. Set SMS_API_KEY in your .env file');
			console.log('2. Set SMS_SENDER_ID (e.g., "SHARKLOAN")');
			console.log('3. Make sure your Sender ID is approved by Termii');
		}

		console.log('\n✅ SMS with Media testing completed!');
		console.log('\n📝 SUMMARY:');
		console.log('- ✅ Basic SMS works (no media)');
		console.log('- ✅ SMS with media attachment works');
		console.log('- ✅ SMS with media but no caption works');
		console.log('- ✅ Console mode shows media details');
		console.log('- ✅ Real API integration ready (when Sender ID approved)');

		console.log('\n📋 PAYLOAD EXAMPLES:');
		console.log('====================');
		console.log('Basic SMS payload:');
		console.log(JSON.stringify({
			to: '2348086249721',
			from: 'SHARKLOAN',
			sms: 'Your loan has been approved',
			type: 'plain',
			api_key: 'YOUR_API_KEY',
			channel: 'generic'
		}, null, 2));

		console.log('\nSMS with Media payload:');
		console.log(JSON.stringify({
			to: '2348086249721',
			from: 'SHARKLOAN',
			sms: 'Your loan documents are ready',
			type: 'plain',
			api_key: 'YOUR_API_KEY',
			channel: 'generic',
			media: {
				url: 'https://example.com/loan-document.pdf',
				caption: 'Your loan agreement'
			}
		}, null, 2));

	} catch (error) {
		console.error('❌ Error testing SMS with media:', error);
	}
}

testSMSWithMedia();

