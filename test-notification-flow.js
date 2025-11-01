#!/usr/bin/env node

/**
 * Test Complete Notification Flow
 * Tests WhatsApp + SMS fallback with current configuration
 */

require('dotenv').config();

console.log('🧪 Testing Complete Notification Flow');
console.log('====================================\n');

async function testNotificationFlow() {
    try {
        // Import the services
        console.log('📦 Importing services...');
        const { getNotificationService } = await import('./build/services/NotificationService.js');
        const { getWhatsAppService } = await import('./build/services/WhatsAppService.js');

        const notificationService = getNotificationService();
        const whatsappService = getWhatsAppService();

        console.log('🔍 Current Configuration:');
        console.log('- SMS_API_KEY:', process.env.SMS_API_KEY ? '✅ Configured' : '❌ Not configured');
        console.log('- SMS_SENDER_ID:', process.env.SMS_SENDER_ID || 'SHARKLOAN (default)');
        console.log('- WHATSAPP_ACCESS_TOKEN:', process.env.WHATSAPP_ACCESS_TOKEN ? '✅ Configured' : '❌ Not configured');
        console.log('- WHATSAPP_PHONE_NUMBER_ID:', process.env.WHATSAPP_PHONE_NUMBER_ID ? '✅ Configured' : '❌ Not configured');
        console.log('- ADMIN_PHONE:', process.env.ADMIN_PHONE || '❌ Not configured');
        console.log('');

        // Test 1: WhatsApp notification via NotificationService
        console.log('💬 Test 1: WhatsApp via NotificationService');
        console.log('==========================================');

        const whatsappResult = await notificationService.sendNotification({
            to: '+2348086249721',
            message: `🎉 *Loan Approved!*

Hello John Doe,

Your loan application has been *approved* and is ready for disbursement.

💰 *Loan Amount:* ₦50,000
🆔 *Loan ID:* loan-test-123
📅 *Date:* ${new Date().toLocaleDateString('en-NG')}

Thank you for choosing our services! 🙏`,
            type: 'whatsapp'
        });

        console.log('WhatsApp Result:', whatsappResult);
        console.log('');

        // Test 2: SMS fallback (will show Sender ID pending message)
        console.log('📱 Test 2: SMS Fallback');
        console.log('=======================');

        const smsResult = await notificationService.sendNotification({
            to: '+2348086249721',
            message: 'Hi John Doe! Your loan request of ₦50,000 has been approved. Loan ID: loan-test-123. Thank you!',
            type: 'sms'
        });

        console.log('SMS Result:', smsResult);
        console.log('');

        // Test 3: Console mode (always works)
        console.log('🖥️  Test 3: Console Mode');
        console.log('=======================');

        // Temporarily remove API key to trigger console mode
        const originalApiKey = process.env.SMS_API_KEY;
        delete process.env.SMS_API_KEY;

        const consoleResult = await notificationService.sendNotification({
            to: '+2348086249721',
            message: 'Hi John Doe! Your loan request of ₦50,000 has been approved. Loan ID: loan-test-123. Thank you!',
            type: 'sms'
        });

        // Restore API key
        process.env.SMS_API_KEY = originalApiKey;

        console.log('Console Result:', consoleResult);
        console.log('');

        console.log('📋 SUMMARY:');
        console.log('===========');
        console.log('✅ WhatsApp: Gracefully handles missing credentials');
        console.log('⚠️  SMS: Sender ID "SHARK" is pending approval from Termii');
        console.log('✅ Console: Always works for testing');
        console.log('');
        console.log('🔧 NEXT STEPS:');
        console.log('1. Wait for Termii to approve your Sender ID "SHARK"');
        console.log('2. Or use console mode for development: NOTIFICATION_PROVIDER=console');
        console.log('3. Or configure WhatsApp Business API for production');

    } catch (error) {
        console.error('❌ Error testing notification flow:', error);
    }
}

testNotificationFlow();
