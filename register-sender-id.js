#!/usr/bin/env node

/**
 * Register Sender ID with Termii
 * This script helps you register a new Sender ID for SMS notifications
 */

require('dotenv').config();
const axios = require('axios');

console.log('📝 Termii Sender ID Registration');
console.log('=================================\n');

async function registerSenderId() {
    try {
        const apiKey = process.env.SMS_API_KEY;

        if (!apiKey) {
            console.error('❌ SMS_API_KEY not found in environment variables');
            console.log('💡 Add SMS_API_KEY to your .env file');
            return;
        }

        console.log('🔑 API Key found:', apiKey.substring(0, 10) + '...');

        // Sender ID details
        const senderData = {
            api_key: apiKey,
            sender_id: process.env.SMS_SENDER_ID || 'SHARKLOAN',
            usecase: 'Loan notifications: Your loan request has been approved and is being processed.',
            company: 'Loan Shark App'
        };

        console.log('📤 Registering Sender ID:', senderData.sender_id);
        console.log('🏢 Company:', senderData.company);
        console.log('📝 Use case:', senderData.usecase);

        const response = await axios.post('https://api.termii.com/api/sender-id/request', senderData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('\n✅ Sender ID registration response:');
        console.log(JSON.stringify(response.data, null, 2));

        if (response.data.code === 'ok') {
            console.log('\n🎉 Sender ID registration successful!');
            console.log('📧 You will be contacted by your account manager for approval.');
            console.log('\n⏳ Next steps:');
            console.log('1. Wait for Termii to approve your Sender ID');
            console.log('2. Check your email for approval notification');
            console.log('3. Once approved, SMS notifications will work');
        }

    } catch (error) {
        console.error('❌ Error registering Sender ID:', error.response?.data || error.message);

        if (error.response?.status === 401) {
            console.log('\n💡 Authentication failed. Check your SMS_API_KEY in .env file');
        } else if (error.response?.status === 400) {
            console.log('\n💡 Bad request. Check your Sender ID format (3-11 alphanumeric characters)');
        }
    }
}

// Also check existing Sender IDs
async function checkExistingSenderIds() {
    try {
        const apiKey = process.env.SMS_API_KEY;

        if (!apiKey) {
            console.log('⚠️ Cannot check existing Sender IDs without API key');
            return;
        }

        console.log('\n🔍 Checking existing Sender IDs...');

        const response = await axios.get(`https://api.termii.com/api/sender-id?api_key=${apiKey}`);

        console.log('\n📋 Your registered Sender IDs:');
        console.log('===============================');

        if (response.data.content && response.data.content.length > 0) {
            response.data.content.forEach((sender, index) => {
                console.log(`${index + 1}. ${sender.sender_id} - Status: ${sender.status}`);
                console.log(`   Country: ${sender.country}`);
                console.log(`   Created: ${sender.createdAt}`);
                if (sender.usecase) {
                    console.log(`   Use case: ${sender.usecase}`);
                }
                console.log('');
            });
        } else {
            console.log('No Sender IDs found. You need to register one first.');
        }

    } catch (error) {
        console.error('❌ Error checking Sender IDs:', error.response?.data || error.message);
    }
}

async function main() {
    await checkExistingSenderIds();
    await registerSenderId();
}

main();
