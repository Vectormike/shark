import { BasePaymentGateway } from './BasePaymentGateway';
import { PaystackIntegration } from './PaystackIntegration';
import { FlutterwaveIntegration } from './FlutterwaveIntegration';
import { PaymentProvider } from './types';

export class PaymentIntegrationFactory {
    static create(provider: PaymentProvider = 'paystack'): BasePaymentGateway {
        switch (provider) {
            case 'paystack':
                return new PaystackIntegration();
            case 'flutterwave':
                return new FlutterwaveIntegration();
            default:
                throw new Error(`Unsupported payment provider: ${provider}`);
        }
    }

    static getAvailableProviders(): PaymentProvider[] {
        return ['paystack', 'flutterwave'];
    }

    static isProviderSupported(provider: string): provider is PaymentProvider {
        return ['paystack', 'flutterwave'].includes(provider);
    }
}
