import { BasePaymentGateway } from './BasePaymentGateway';
import {
	PaymentInitializationData,
	PaymentVerificationResponse,
	PaymentRefundData,
	PaymentGatewayResponse,
	TransferData,
	TransferResponse
} from './types';

export class FlutterwaveIntegration extends BasePaymentGateway {
	constructor() {
		const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
		if (!secretKey) {
			throw new Error('Flutterwave secret key is required');
		}
		super('https://api.flutterwave.com/v3', secretKey, 'Flutterwave');
	}

	async initializePayment(data: PaymentInitializationData): Promise<PaymentGatewayResponse> {
		try {
			const response = await this.client.post('/payments', {
				tx_ref: data.reference,
				amount: data.amount,
				currency: 'NGN',
				redirect_url: data.callback_url,
				customer: {
					email: data.email,
				},
				customizations: {
					title: 'Loan Repayment',
					description: 'Payment for loan repayment',
				},
				meta: data.metadata,
			});

			return {
				success: true,
				authorization_url: response.data.data.link,
				reference: data.reference,
				data: response.data.data,
			};
		} catch (error: any) {
			return this.handleError(error, 'payment initialization');
		}
	}

	async verifyPayment(reference: string): Promise<PaymentVerificationResponse> {
		try {
			const response = await this.client.get(`/transactions/${reference}/verify`);
			const transaction = response.data.data;

			return {
				success: transaction.status === 'successful',
				reference: transaction.tx_ref,
				amount: transaction.amount,
				status: transaction.status,
				gateway_response: transaction,
			};
		} catch (error: any) {
			console.error('Flutterwave verification error:', error.response?.data || error.message);
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
			const response = await this.client.post(`/transactions/${data.transaction}/refund`, {
				amount: data.amount,
				comments: data.merchant_note,
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
			const response = await this.client.post('/transfers', {
				account_bank: data.recipient_code.split('_')[0], // Extract bank code
				account_number: data.recipient_code.split('_')[1], // Extract account number
				amount: data.amount,
				narration: data.reason || 'Loan disbursement',
				currency: data.currency || 'NGN',
				reference: data.reference,
				callback_url: `${process.env.APP_URL}/api/transfers/callback`
			});

			return {
				success: true,
				transfer_code: response.data.data.id,
				reference: response.data.data.reference,
				status: response.data.data.status,
				amount: response.data.data.amount,
				recipient: {
					type: 'bank',
					name: response.data.data.full_name,
					account_number: response.data.data.account_number,
					bank_code: response.data.data.account_bank
				}
			};
		} catch (error: any) {
			console.error('Flutterwave transfer error:', error.response?.data || error.message);
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
			const response = await this.client.get(`/transfers/${reference}`);

			return {
				success: true,
				transfer_code: response.data.data.id,
				reference: response.data.data.reference,
				status: response.data.data.status,
				amount: response.data.data.amount,
				recipient: {
					type: 'bank',
					name: response.data.data.full_name,
					account_number: response.data.data.account_number,
					bank_code: response.data.data.account_bank
				}
			};
		} catch (error: any) {
			console.error('Flutterwave transfer verification error:', error.response?.data || error.message);
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
