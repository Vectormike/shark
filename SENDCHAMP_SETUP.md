# SendChamp Setup Guide

This guide will help you set up SendChamp as an alternative SMS provider for your Loan Shark App.

## 🚀 Quick Setup

### 1. Create SendChamp Account
1. Visit [sendchamp.com](https://sendchamp.com)
2. Sign up for an account
3. Verify your email address
4. Complete your profile setup

### 2. Get API Credentials
1. Log into your SendChamp dashboard
2. Navigate to **Settings** > **API Keys**
3. Copy your **API Key**
4. Note your **Sender ID** (or create one if needed)

### 3. Configure Environment Variables
Add these to your `.env` file:

```env
# SendChamp Configuration
SMS_PROVIDER=sendchamp
SMS_API_KEY=your_sendchamp_api_key_here
SMS_SENDER_ID=your_sender_id_here
```

### 4. Test the Integration
```bash
# Test with console mode first
node test-sendchamp-integration.js

# Test with real API (make sure credentials are set)
SMS_PROVIDER=sendchamp node test-sendchamp-integration.js
```

## 📋 SendChamp vs Termii Comparison

| Feature | Termii | SendChamp |
|---------|--------|-----------|
| **API Field** | `sms` | `message` |
| **Type Field** | `plain` | `text` |
| **Endpoint** | `api.termii.com/api/sms/send` | `api.sendchamp.com/v1/sms/send` |
| **Media Support** | ✅ | ✅ |
| **WhatsApp** | ✅ | ✅ |
| **Voice** | ✅ | ✅ |
| **Coverage** | Nigeria, Ghana, Kenya | Nigeria, Ghana, Kenya |

## 🔧 API Format Differences

### Termii Format:
```json
{
  "to": "2348086249721",
  "from": "SHARKLOAN",
  "sms": "Your loan has been approved",
  "type": "plain",
  "api_key": "your_api_key",
  "channel": "generic",
  "media": {
    "url": "https://example.com/document.pdf",
    "caption": "Your loan agreement"
  }
}
```

### SendChamp Format:
```json
{
  "to": "2348086249721",
  "from": "SHARKLOAN",
  "message": "Your loan has been approved",
  "type": "text",
  "api_key": "your_api_key",
  "channel": "generic",
  "media": {
    "url": "https://example.com/document.pdf",
    "caption": "Your loan agreement"
  }
}
```

**Key Difference**: SendChamp uses `"message"` instead of `"sms"` field.

## 🎯 Switching Between Providers

### Option 1: Environment Variable
```bash
# Use SendChamp
export SMS_PROVIDER=sendchamp

# Use Termii
export SMS_PROVIDER=termii
```

### Option 2: Update .env File
```env
# For SendChamp
SMS_PROVIDER=sendchamp
SMS_API_KEY=your_sendchamp_key

# For Termii
SMS_PROVIDER=termii
SMS_API_KEY=your_termii_key
```

### Option 3: Runtime Configuration
```javascript
// In your application
process.env.SMS_PROVIDER = 'sendchamp';
```

## 💰 Pricing Comparison

| Provider | Nigeria SMS | Ghana SMS | Kenya SMS | Features |
|----------|-------------|-----------|-----------|----------|
| **SendChamp** | ₦2.50 | $0.025 | $0.025 | SMS, WhatsApp, Voice |
| **Termii** | ₦2.80 | $0.028 | $0.028 | SMS, WhatsApp, Voice |

*Prices may vary based on volume and current rates*

## 🔄 Migration Benefits

### Why Use SendChamp?
1. **Similar API**: Minimal code changes needed
2. **Better Pricing**: Often cheaper than Termii
3. **Reliability**: Good uptime and delivery rates
4. **Support**: Responsive customer service
5. **Features**: WhatsApp, Voice, Email support

### Fallback Strategy
You can easily switch between providers:
```javascript
// In your loan creation logic
const smsResult = await notificationService.sendNotification({
  to: borrower.phone,
  message: smsMessage,
  type: 'sms'
});

// If SMS fails, try the other provider
if (!smsResult.success && process.env.SMS_PROVIDER === 'termii') {
  process.env.SMS_PROVIDER = 'sendchamp';
  // Retry with SendChamp
}
```

## 🧪 Testing

### Console Mode Testing
```bash
# Test both providers in console mode
SMS_PROVIDER=termii NOTIFICATION_PROVIDER=console node test-sendchamp-integration.js
SMS_PROVIDER=sendchamp NOTIFICATION_PROVIDER=console node test-sendchamp-integration.js
```

### Real API Testing
```bash
# Test with real SendChamp API
SMS_PROVIDER=sendchamp SMS_API_KEY=your_key node test-sendchamp-integration.js
```

## 📞 Support

- **SendChamp Support**: support@sendchamp.com
- **Documentation**: [docs.sendchamp.com](https://docs.sendchamp.com)
- **Status Page**: [status.sendchamp.com](https://status.sendchamp.com)

## 🔒 Security Notes

1. **Never commit API keys** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate API keys** regularly
4. **Monitor usage** in your dashboard
5. **Set up alerts** for unusual activity

## 🎉 Next Steps

1. **Set up SendChamp account** and get API credentials
2. **Update your .env file** with SendChamp credentials
3. **Test the integration** using the test scripts
4. **Switch your production environment** to SendChamp
5. **Monitor delivery rates** and performance
6. **Keep Termii as backup** for redundancy

---

**Need Help?** Check the test scripts in this project:
- `test-sendchamp-integration.js` - Test SendChamp functionality
- `test-notification-flow.js` - Test complete notification flow
- `test-sms-with-media.js` - Test SMS with media attachments

