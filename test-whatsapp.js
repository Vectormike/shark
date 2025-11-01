#!/usr/bin/env node

/**
 * Test WhatsApp Notification Script
 * Tests WhatsApp notifications for loan creation
 */

const { getWhatsAppService } = require('./build/services/WhatsAppService');

async function testWhatsApp() {
	const phoneNumber = process.argv[2];

	if (!phoneNumber) {
		console.error('❌ Please provide a phone number');
		console.log('Usage: node test-whatsapp.js +2348012345678');
		console.log('       node test-whatsapp.js 08012345678');
		process.exit(1);
	}

	console.log('🧪 Testing WhatsApp notifications...');
	console.log(`📱 Phone number: ${phoneNumber}`);
	console.log('');

	const whatsappService = getWhatsAppService();

	try {
		// Test 1: Check if number is on WhatsApp
		console.log('🔍 Checking if number is on WhatsApp...');
		const isOnWhatsApp = await whatsappService.isOnWhatsApp(phoneNumber);

		if (isOnWhatsApp) {
			console.log('✅ Number is on WhatsApp!');
		} else {
			console.log('❌ Number is not on WhatsApp or not accessible');
			console.log('💡 This could mean:');
			console.log('   - The number is not registered on WhatsApp');
			console.log('   - WhatsApp API credentials are not configured');
			console.log('   - The number is not accessible via WhatsApp Business API');
			return;
		}

		console.log('');

		// Test 2: Send loan creation notification
		console.log('📤 Sending loan creation notification...');
		const result = await whatsappService.sendLoanCreationNotification(
			'John Doe',
			phoneNumber,
			50000,
			'test-loan-123'
		);

		if (result.success) {
			console.log('✅ WhatsApp notification sent successfully!');
			console.log(`   Message ID: ${result.messageId}`);
		} else {
			console.log('❌ WhatsApp notification failed:', result.error);
		}

		console.log('');

		// Test 3: Send admin notification
		console.log('📤 Sending admin notification...');
		const adminResult = await whatsappService.sendAdminLoanNotification(
			phoneNumber, // Using same number for testing
			'John Doe',
			50000,
			'test-loan-123'
		);

		if (adminResult.success) {
			console.log('✅ Admin notification sent successfully!');
			console.log(`   Message ID: ${adminResult.messageId}`);
		} else {
			console.log('❌ Admin notification failed:', adminResult.error);
		}

		console.log('');
		console.log('🏁 WhatsApp test completed!');

	} catch (error) {
		console.error('❌ Error testing WhatsApp:', error.message);
		console.log('');
		console.log('💡 Make sure you have configured:');
		console.log('   - WHATSAPP_ACCESS_TOKEN');
		console.log('   - WHATSAPP_PHONE_NUMBER_ID');
	}
}

// Build the project first, then test
const { execSync } = require('child_process');

try {
	console.log('🔨 Building project...');
	execSync('pnpm build', { stdio: 'inherit' });
	console.log('✅ Build completed');
	console.log('');

	testWhatsApp();
} catch (error) {
	console.error('❌ Build failed:', error.message);
}
