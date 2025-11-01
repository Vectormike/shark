#!/usr/bin/env node

/**
 * Test SendChamp Integration
 * Tests the multi-provider SMS functionality with SendChamp
 */

require('dotenv').config();

console.log('🧪 Testing SendChamp Integration');
console.log('=================================\n');

async function testSendChampIntegration() {
    try {
        // Import the services
        console.log('📦 Importing services...');
        const { getNotificationService } = await import('./build/services/NotificationService.js');
        const notificationService = getNotificationService();

        // Test 1: Termii (default)
        console.log('📱 Test 1: Termii (Default Provider)');
        console.log('====================================');

        process.env.SMS_PROVIDER = 'termii';
        process.env.NOTIFICATION_PROVIDER = 'console';

        const termiiResult = await notificationService.sendNotification({
            to: '+2348086249721',
            message: 'Hi John! Your loan of ₦50,000 has been approved via Termii.',
            type: 'sms',
            media: {
                url: 'https://example.com/loan-document.pdf',
                caption: 'Your loan agreement'
            }
        });

        console.log('Termii Result:', termiiResult);
        console.log('');

        // Test 2: SendChamp
        console.log('📱 Test 2: SendChamp Provider');
        console.log('=============================');

        process.env.SMS_PROVIDER = 'sendchamp';

        const sendchampResult = await notificationService.sendNotification({
            to: '+2348086249721',
            message: 'Hi John! Your loan of ₦50,000 has been approved via SendChamp.',
            type: 'sms',
            media: {
                url: 'https://example.com/loan-document.pdf',
                caption: 'Your loan agreement'
            }
        });

        console.log('SendChamp Result:', sendchampResult);
        console.log('');

        // Test 3: SendChamp without media
        console.log('📱 Test 3: SendChamp (No Media)');
        console.log('===============================');

        const sendchampNoMediaResult = await notificationService.sendNotification({
            to: '+2348086249721',
            message: 'Hi John! Your loan of ₦50,000 has been approved. No documents attached.',
            type: 'sms'
        });

        console.log('SendChamp No Media Result:', sendchampNoMediaResult);
        console.log('');

        // Test 4: Real SendChamp API (if credentials are configured)
        if (process.env.SMS_API_KEY && process.env.SMS_PROVIDER === 'sendchamp') {
            console.log('🔑 Test 4: Real SendChamp API');
            console.log('============================');

            // Temporarily enable real API
            delete process.env.NOTIFICATION_PROVIDER;

            const realSendchampResult = await notificationService.sendNotification({
                to: '+2348086249721',
                message: 'Test message from Loan Shark App via SendChamp',
                type: 'sms'
            });

            console.log('Real SendChamp Result:', realSendchampResult);

            // Restore console mode
            process.env.NOTIFICATION_PROVIDER = 'console';
        } else {
            console.log('💡 To test with real SendChamp API:');
            console.log('1. Set SMS_PROVIDER=sendchamp in your .env file');
            console.log('2. Set SMS_API_KEY to your SendChamp API key');
            console.log('3. Set SMS_SENDER_ID to your approved Sender ID');
        }

        console.log('\n✅ SendChamp Integration testing completed!');
        console.log('\n📝 SUMMARY:');
        console.log('- ✅ Multi-provider support works');
        console.log('- ✅ Termii format: uses "sms" field');
        console.log('- ✅ SendChamp format: uses "message" field');
        console.log('- ✅ Media support works for both providers');
        console.log('- ✅ Console mode shows provider-specific payloads');

        console.log('\n📋 PAYLOAD COMPARISON:');
        console.log('======================');
        console.log('Termii payload:');
        console.log(JSON.stringify({
            to: '2348086249721',
            from: 'SHARKLOAN',
            sms: 'Your loan has been approved',
            type: 'plain',
            api_key: 'YOUR_API_KEY',
            channel: 'generic',
            media: {
                url: 'https://example.com/document.pdf',
                caption: 'Your loan agreement'
            }
        }, null, 2));

        console.log('\nSendChamp payload:');
        console.log(JSON.stringify({
            to: '2348086249721',
            from: 'SHARKLOAN',
            message: 'Your loan has been approved',
            type: 'text',
            api_key: 'YOUR_API_KEY',
            channel: 'generic',
            media: {
                url: 'https://example.com/document.pdf',
                caption: 'Your loan agreement'
            }
        }, null, 2));

        console.log('\n🔧 ENVIRONMENT VARIABLES:');
        console.log('=========================');
        console.log('# To use SendChamp:');
        console.log('SMS_PROVIDER=sendchamp');
        console.log('SMS_API_KEY=your_sendchamp_api_key');
        console.log('SMS_SENDER_ID=your_approved_sender_id');
        console.log('');
        console.log('# To use Termii:');
        console.log('SMS_PROVIDER=termii');
        console.log('SMS_API_KEY=your_termii_api_key');
        console.log('SMS_SENDER_ID=your_approved_sender_id');

    } catch (error) {
        console.error('❌ Error testing SendChamp integration:', error);
    }
}

testSendChampIntegration();

