import { BasePaymentGateway } from './BasePaymentGateway';
import {
	PaymentInitializationData,
	PaymentVerificationResponse,
	PaymentRefundData,
	PaymentGatewayResponse,
	TransferData,
	TransferResponse
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

	async createTransfer(data: TransferData): Promise<TransferResponse> {
		try {
			// For Paystack, we need to create a recipient first if recipient_code is in bank_account format
			let recipientCode = data.recipient_code;

			// Check if recipient_code is in bank_account format (bank_code_account_number)
			if (data.recipient_code.includes('_') && data.recipient_code.split('_').length === 2) {
				const [bankCode, accountNumber] = data.recipient_code.split('_');

				console.log(`🏦 Creating recipient with bank_code: ${bankCode}, account_number: ${accountNumber}`);

				// Create a recipient first
				const recipientResponse = await this.client.post('/transferrecipient', {
					type: 'nuban',
					name: data.account_name || 'Loan Borrower',
					account_number: accountNumber,
					bank_code: bankCode,
					currency: data.currency || 'NGN'
				});

				console.log('📋 Recipient creation response:', recipientResponse.data);

				if (recipientResponse.data.status) {
					recipientCode = recipientResponse.data.data.recipient_code;
					console.log(`✅ Recipient created with code: ${recipientCode}`);
				} else {
					throw new Error('Failed to create recipient: ' + recipientResponse.data.message);
				}
			}

			const response = await this.client.post('/transfer', {
				source: 'balance',
				amount: this.formatAmount(data.amount),
				recipient: recipientCode,
				reason: data.reason || 'Loan disbursement',
				reference: data.reference,
				currency: data.currency || 'NGN'
			});

			console.log('📋 Transfer response:', response.data);

			return {
				success: true,
				transfer_code: response.data.data.transfer_code,
				reference: response.data.data.reference,
				status: response.data.data.status,
				amount: response.data.data.amount / 100, // Convert from kobo
				recipient: {
					type: response.data.data.recipient?.type || 'bank',
					name: response.data.data.recipient?.name || 'Unknown',
					account_number: response.data.data.recipient?.details?.account_number || '',
					bank_code: response.data.data.recipient?.details?.bank_code || ''
				}
			};
		} catch (error: any) {
			console.error('❌ Paystack transfer error:', error.response?.data || error.message);

			// Handle specific Paystack errors
			if (error.response?.data?.message?.includes('transfer_unavailable')) {
				return {
					success: false,
					transfer_code: '',
					reference: data.reference,
					status: 'transfer_unavailable',
					amount: data.amount,
					recipient: {
						type: '',
						name: '',
						account_number: '',
						bank_code: ''
					}
				};
			}

			return {
				success: false,
				transfer_code: '',
				reference: data.reference,
				status: 'failed',
				amount: data.amount,
				recipient: {
					type: '',
					name: '',
					account_number: '',
					bank_code: ''
				}
			};
		}
	}

	async verifyTransfer(reference: string): Promise<TransferResponse> {
		try {
			const response = await this.client.get(`/transfer/verify/${reference}`);

			return {
				success: true,
				transfer_code: response.data.data.transfer_code,
				reference: response.data.data.reference,
				status: response.data.data.status,
				amount: response.data.data.amount / 100, // Convert from kobo
				recipient: {
					type: response.data.data.recipient.type,
					name: response.data.data.recipient.name,
					account_number: response.data.data.recipient.details.account_number,
					bank_code: response.data.data.recipient.details.bank_code
				}
			};
		} catch (error: any) {
			console.error('Paystack transfer verification error:', error.response?.data || error.message);
			return {
				success: false,
				transfer_code: '',
				reference: reference,
				status: 'failed',
				amount: 0,
				recipient: {
					type: '',
					name: '',
					account_number: '',
					bank_code: ''
				}
			};
		}
	}
}
