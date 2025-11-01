#!/usr/bin/env node

/**
 * Test Notification Messages
 * Shows what WhatsApp messages would look like
 */

console.log('🧪 Testing Notification Messages (WhatsApp + SMS Fallback)');
console.log('=========================================================\n');

// Simulate loan data
const borrowerName = 'John Doe';
const amount = 50000;
const loanId = 'loan-123-abc';

// Borrower WhatsApp notification message
console.log('📱 BORROWER WHATSAPP NOTIFICATION:');
console.log('=================================');
const borrowerMessage = `🎉 *Loan Approved!*

Hello ${borrowerName},

Your loan application has been *approved* and is ready for disbursement.

💰 *Loan Amount:* ₦${amount.toLocaleString()}
🆔 *Loan ID:* ${loanId}
📅 *Date:* ${new Date().toLocaleDateString('en-NG')}

The loan will be disbursed to your account shortly. You will receive another notification once the money has been sent.

Thank you for choosing our services! 🙏`;

console.log(borrowerMessage);
console.log('\n');

// Admin WhatsApp notification message
console.log('👨‍💼 ADMIN WHATSAPP NOTIFICATION:');
console.log('==============================');
const adminMessage = `📋 *New Loan Created*

👤 *Borrower:* ${borrowerName}
💰 *Amount:* ₦${amount.toLocaleString()}
🆔 *Loan ID:* ${loanId}
📅 *Date:* ${new Date().toLocaleDateString('en-NG')}

The loan has been approved and is ready for disbursement.`;

console.log(adminMessage);
console.log('\n');

// SMS Fallback messages
console.log('📲 SMS FALLBACK MESSAGES:');
console.log('========================');

// Borrower SMS message
console.log('📱 BORROWER SMS:');
const borrowerSmsMessage = `Hi ${borrowerName}! Your loan request of ₦${amount.toLocaleString()} has been approved and is being processed. Loan ID: ${loanId}. You will receive further updates shortly. Thank you for choosing our service!`;
console.log(borrowerSmsMessage);
console.log('\n');

// Admin SMS message
console.log('👨‍💼 ADMIN SMS:');
const adminSmsMessage = `New loan approved for ${borrowerName}: ₦${amount.toLocaleString()} (ID: ${loanId}). Please review and process disbursement.`;
console.log(adminSmsMessage);
console.log('\n');

console.log('🔄 NOTIFICATION FLOW:');
console.log('====================');
console.log('1. 💬 Try WhatsApp first (if credentials configured)');
console.log('2. 📲 If WhatsApp fails, send SMS as fallback');
console.log('3. ✅ Log success/failure for each attempt');
console.log('\n💡 To enable WhatsApp: Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID');
console.log('💡 To enable SMS: Set NOTIFICATION_PROVIDER to your SMS service');
