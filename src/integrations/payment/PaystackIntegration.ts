import { BasePaymentGateway } from './BasePaymentGateway';
import {
    PaymentInitializationData,
    PaymentVerificationResponse,
    PaymentRefundData,
    PaymentGatewayResponse
} from './types';

export class PaystackIntegration extends BasePaymentGateway {
    constructor() {
        const secretKey = process.env.PAYSTACK_SECRET_KEY;
        if (!secretKey) {
            throw new Error('Paystack secret key is required');
        }
        super('https://api.paystack.co', secretKey, 'Paystack');
    }

    async initializePayment(data: PaymentInitializationData): Promise<PaymentGatewayResponse> {
        try {
            const response = await this.client.post('/transaction/initialize', {
                amount: this.formatAmount(data.amount),
                email: data.email,
                reference: data.reference,
                callback_url: data.callback_url,
                metadata: data.metadata,
                channels: data.channels || ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
            });

            return {
                success: true,
                authorization_url: response.data.data.authorization_url,
                access_code: response.data.data.access_code,
                reference: response.data.data.reference,
                data: response.data.data,
            };
        } catch (error: any) {
            return this.handleError(error, 'payment initialization');
        }
    }

    async verifyPayment(reference: string): Promise<PaymentVerificationResponse> {
        try {
            const response = await this.client.get(`/transaction/verify/${reference}`);
            const transaction = response.data.data;

            return {
                success: transaction.status === 'success',
                reference: transaction.reference,
                amount: transaction.amount / 100, // Convert from kobo
                status: transaction.status,
                gateway_response: transaction,
            };
        } catch (error: any) {
            console.error('Paystack verification error:', error.response?.data || error.message);
            return {
                success: false,
                reference,
                amount: 0,
                status: 'failed',
                gateway_response: error.response?.data,
            };
        }
    }

    async refundPayment(data: PaymentRefundData): Promise<PaymentGatewayResponse> {
        try {
            const response = await this.client.post(`/refund`, {
                transaction: data.transaction,
                amount: data.amount ? this.formatAmount(data.amount) : undefined,
                merchant_note: data.merchant_note,
                customer_note: data.customer_note,
            });

            return {
                success: true,
                data: response.data.data,
            };
        } catch (error: any) {
            return this.handleError(error, 'refund');
        }
    }
}
