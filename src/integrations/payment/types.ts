// Payment integration types and interfaces

export interface PaymentInitializationData {
	amount: number;
	email: string;
	reference: string;
	callback_url?: string;
	metadata?: any;
	channels?: string[];
}

export interface PaymentVerificationResponse {
	success: boolean;
	reference: string;
	amount: number;
	status: string;
	gateway_response: any;
}

export interface PaymentRefundData {
	transaction: string;
	amount?: number;
	merchant_note?: string;
	customer_note?: string;
}

export interface TransferData {
	amount: number;
	recipient_code: string;
	reference: string;
	reason?: string;
	currency?: string;
	account_name?: string; // For creating recipients
}

export interface TransferResponse {
	success: boolean;
	transfer_code: string;
	reference: string;
	status: string;
	amount: number;
	recipient: {
		type: string;
		name: string;
		account_number: string;
		bank_code: string;
	};
}

export interface PaymentGatewayResponse {
	success: boolean;
	authorization_url?: string;
	access_code?: string;
	reference?: string;
	message?: string;
	data?: any;
}

export type PaymentProvider = 'paystack' | 'flutterwave';
