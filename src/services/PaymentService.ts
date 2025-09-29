import {
  PaymentIntegrationFactory,
  BasePaymentGateway,
  PaymentInitializationData,
  PaymentVerificationResponse,
  PaymentRefundData,
  PaymentProvider
} from '../integrations/payment';

// Payment service class that uses integrations
export class PaymentService {
  private integration: BasePaymentGateway;

  constructor(provider: PaymentProvider = 'paystack') {
    this.integration = PaymentIntegrationFactory.create(provider);
  }

  // Initialize payment
  async initializePayment(data: PaymentInitializationData) {
    return await this.integration.initializePayment(data);
  }

  // Verify payment
  async verifyPayment(reference: string): Promise<PaymentVerificationResponse> {
    return await this.integration.verifyPayment(reference);
  }

  // Refund payment
  async refundPayment(data: PaymentRefundData) {
    return await this.integration.refundPayment(data);
  }

  // Switch payment provider
  switchProvider(provider: PaymentProvider) {
    this.integration = PaymentIntegrationFactory.create(provider);
  }

  // Get current provider
  getCurrentProvider(): string {
    return this.integration.constructor.name.replace('Integration', '').toLowerCase();
  }
}

// Utility functions
export const generatePaymentReference = (prefix: string = 'LN'): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}_${timestamp}_${random}`;
};

export const formatAmount = (amount: number, currency: string = 'NGN'): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
  }).format(amount);
};

// Lazy-loaded payment service instance
let _paymentService: PaymentService | null = null;

export const getPaymentService = (): PaymentService => {
  if (!_paymentService) {
    const paymentProvider = (process.env.PAYMENT_PROVIDER as PaymentProvider) || 'paystack';
    _paymentService = new PaymentService(paymentProvider);
  }
  return _paymentService;
};

// Lazy-loaded payment service getter
export const paymentService = {
  get initializePayment() { return getPaymentService().initializePayment.bind(getPaymentService()); },
  get verifyPayment() { return getPaymentService().verifyPayment.bind(getPaymentService()); },
  get refundPayment() { return getPaymentService().refundPayment.bind(getPaymentService()); },
  get switchProvider() { return getPaymentService().switchProvider.bind(getPaymentService()); },
  get getCurrentProvider() { return getPaymentService().getCurrentProvider.bind(getPaymentService()); }
};
