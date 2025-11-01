# 💬 WhatsApp Setup Guide

This guide helps you set up WhatsApp Business API for loan notifications.

## 🚀 Quick Setup

### 1. **Get WhatsApp Business API Access**

You have several options:

#### Option A: Meta Business (Official)
1. Go to [Meta for Developers](https://developers.facebook.com)
2. Create a Facebook Business account
3. Create a WhatsApp Business app
4. Get your access token and phone number ID

#### Option B: Third-party Providers (Easier)
- **Twilio WhatsApp API** - Easier setup
- **MessageBird** - Good documentation
- **360Dialog** - WhatsApp Business API provider

### 2. **Environment Variables**

Add these to your `.env` file:

```env
# WhatsApp Business API Configuration
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here

# Admin phone number (where you receive notifications)
ADMIN_PHONE=+2348012345678
```

### 3. **Test the Setup**

```bash
# Build the project
pnpm build

# Test WhatsApp with your phone number
node test-whatsapp.js +2348012345678
```

## 📱 What You'll Get

### **Borrower Notifications:**
```
🎉 Loan Approved!

Hello John Doe,

Your loan application has been approved and is ready for disbursement.

💰 Loan Amount: ₦50,000.00
🆔 Loan ID: loan-123
📅 Date: 02/10/2025

The loan will be disbursed to your account shortly. You will receive another notification once the money has been sent.

Thank you for choosing our services! 🙏
```

### **Admin Notifications:**
```
📋 New Loan Created

👤 Borrower: John Doe
💰 Amount: ₦50,000.00
🆔 Loan ID: loan-123
📅 Date: 02/10/2025

The loan has been approved and is ready for disbursement.
```

## 🔧 How It Works

1. **When a loan is created** → WhatsApp service checks if borrower's phone is on WhatsApp
2. **If on WhatsApp** → Sends notification to borrower
3. **Always sends** → Notification to admin phone
4. **If not on WhatsApp** → Skips borrower notification (logs the reason)

## 🧪 Testing Without WhatsApp API

If you don't have WhatsApp API access yet, the system will:
- Log that credentials are not configured
- Skip WhatsApp notifications
- Continue with normal loan creation

## 📊 Features

- ✅ **Automatic detection** - Checks if phone number is on WhatsApp
- ✅ **Borrower notifications** - Loan approval messages
- ✅ **Admin notifications** - New loan alerts
- ✅ **Error handling** - Graceful fallback if WhatsApp fails
- ✅ **Phone number formatting** - Handles Nigerian numbers correctly

## 🎯 Next Steps

1. **Set up WhatsApp Business API** (choose one option above)
2. **Add environment variables** to your `.env` file
3. **Test with your phone number** using the test script
4. **Create a loan** and see the notifications in action!

The system will automatically send WhatsApp notifications whenever loans are created through your API.
