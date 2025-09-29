import axios, { AxiosInstance } from 'axios';
import {
	PaymentInitializationData,
	PaymentVerificationResponse,
	PaymentRefundData,
	PaymentGatewayResponse,
	TransferData,
	TransferResponse
} from './types';

// Abstract Payment Gateway class
export abstract class BasePaymentGateway {
	protected client: AxiosInstance;
	protected provider: string;

	constructor(baseURL: string, secretKey: string, provider: string) {
		this.provider = provider;
		this.client = axios.create({
			baseURL,
			headers: {
				'Authorization': `Bearer ${secretKey}`,
				'Content-Type': 'application/json',
			},
		});
	}

	abstract initializePayment(data: PaymentInitializationData): Promise<PaymentGatewayResponse>;
	abstract verifyPayment(reference: string): Promise<PaymentVerificationResponse>;
	abstract refundPayment(data: PaymentRefundData): Promise<PaymentGatewayResponse>;
	abstract createTransfer(data: TransferData): Promise<TransferResponse>;
	abstract verifyTransfer(reference: string): Promise<TransferResponse>;

	// Common utility methods
	protected handleError(error: any, operation: string): PaymentGatewayResponse {
		console.error(`${this.provider} ${operation} error:`, error.response?.data || error.message);
		return {
			success: false,
			message: error.response?.data?.message || `${operation} failed`,
		};
	}

	protected formatAmount(amount: number): number {
		// Convert to kobo (smallest currency unit for Nigerian Naira)
		return Math.round(amount * 100);
	}
}
