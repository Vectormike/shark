#!/usr/bin/env node

/**
 * Notification API Examples
 * Shows the difference between Termii SMS and WhatsApp Business API
 */

console.log('📋 Notification API Examples');
console.log('============================\n');

// Termii SMS API Examples
console.log('📱 TERMII SMS API EXAMPLES:');
console.log('===========================');

console.log('1. Basic SMS:');
console.log(`{
  "to": "2347880234567",
  "from": "talert",
  "sms": "Hi there, testing Termii",
  "type": "plain",
  "api_key": "Your API key",
  "channel": "generic"
}`);

console.log('\n2. SMS with Media:');
console.log(`{
  "to": "2347880234567",
  "from": "talert",
  "sms": "Hi there, testing Termii",
  "type": "plain",
  "api_key": "Your API key",
  "channel": "generic",
  "media": {
    "url": "https://media.example.com/file",
    "caption": "your media file"
  }
}`);

console.log('\n3. OTP SMS:');
console.log(`{
  "to": "2347880234567",
  "from": "talert",
  "sms": "Your OTP code is 123456",
  "type": "plain",
  "api_key": "Your API key",
  "channel": "dnd"
}`);

console.log('\n💬 WHATSAPP BUSINESS API EXAMPLES:');
console.log('==================================');

console.log('1. Basic Text Message:');
console.log(`{
  "messaging_product": "whatsapp",
  "to": "2347880234567",
  "type": "text",
  "text": {
    "body": "Hello! This is a WhatsApp message from our loan app."
  }
}`);

console.log('\n2. WhatsApp with Image:');
console.log(`{
  "messaging_product": "whatsapp",
  "to": "2347880234567",
  "type": "image",
  "image": {
    "link": "https://media.example.com/image.jpg",
    "caption": "Your loan approval document"
  }
}`);

console.log('\n3. WhatsApp with Document:');
console.log(`{
  "messaging_product": "whatsapp",
  "to": "2347880234567",
  "type": "document",
  "document": {
    "link": "https://media.example.com/contract.pdf",
    "caption": "Your loan agreement"
  }
}`);

console.log('\n4. WhatsApp Template Message:');
console.log(`{
  "messaging_product": "whatsapp",
  "to": "2347880234567",
  "type": "template",
  "template": {
    "name": "loan_approval",
    "language": {
      "code": "en_US"
    },
    "components": [
      {
        "type": "body",
        "parameters": [
          {
            "type": "text",
            "text": "John Doe"
          },
          {
            "type": "text",
            "text": "₦50,000"
          }
        ]
      }
    ]
  }
}`);

console.log('\n🔧 CURRENT IMPLEMENTATION STATUS:');
console.log('==================================');
console.log('✅ SMS: Uses Termii API format (basic text)');
console.log('✅ WhatsApp: Uses Meta Business API format (basic text)');
console.log('⚠️  Media support: Not yet implemented');
console.log('✅ Console mode: Available for both SMS and WhatsApp');

console.log('\n📝 TO ADD MEDIA SUPPORT:');
console.log('=======================');
console.log('1. For SMS with media: Add "media" field to Termii payload');
console.log('2. For WhatsApp with media: Change "type" and add media object');
console.log('3. Update NotificationService.sendSMS() and sendWhatsApp() methods');
console.log('4. Add media URL validation and error handling');

console.log('\n💡 NEXT STEPS:');
console.log('==============');
console.log('1. Wait for Termii Sender ID approval');
console.log('2. Test basic SMS and WhatsApp functionality');
console.log('3. Add media support if needed');
console.log('4. Configure production credentials');

