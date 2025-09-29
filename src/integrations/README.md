# Integrations

This folder contains all external service integrations for the Loan Shark App.

## Structure

```text
src/integrations/
├── payment/           # Payment gateway integrations
│   ├── types.ts      # Payment types and interfaces
│   ├── BasePaymentGateway.ts
│   ├── PaystackIntegration.ts
│   ├── FlutterwaveIntegration.ts
│   ├── PaymentIntegrationFactory.ts
│   └── index.ts
└── README.md
```

## Payment Integrations

### Supported Providers

- **Paystack** - Nigerian payment gateway
- **Flutterwave** - Pan-African payment gateway

### Usage

```typescript
import { PaymentIntegrationFactory } from '../integrations/payment';

// Create integration
const paystackIntegration = PaymentIntegrationFactory.create('paystack');
const flutterwaveIntegration = PaymentIntegrationFactory.create('flutterwave');

// Use integration
const result = await paystackIntegration.initializePayment({
  amount: 50000,
  email: 'user@example.com',
  reference: 'LN_1234567890',
  callback_url: 'https://yourapp.com/callback'
});
```

### Adding New Payment Providers

1. Create a new integration class extending `BasePaymentGateway`
2. Implement the required methods: `initializePayment`, `verifyPayment`, `refundPayment`
3. Add the provider to `PaymentIntegrationFactory`
4. Update the `PaymentProvider` type in `types.ts`

## Future Integrations

This structure is designed to easily accommodate:

- SMS integrations (Twilio, Africa's Talking)
- Email services (SendGrid, Mailgun)
- Banking APIs
- Credit scoring services
- Document management services
