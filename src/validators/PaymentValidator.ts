import { Request, Response, NextFunction } from 'express';
import { BaseValidator, ValidationResult } from './BaseValidator';

export class PaymentValidator extends BaseValidator {
	// Payment initialization validation schema
	private paymentInitSchema = {
		amount: {
			required: true,
			type: 'number',
			min: 100, // Minimum 100 NGN
			max: 10000000, // Maximum 10 million NGN
			custom: (value: number) => {
				if (value % 1 !== 0) {
					return 'Amount must be a whole number (no decimals)';
				}
				return null;
			}
		},
		email: {
			required: true,
			type: 'string',
			pattern: this.emailPattern
		},
		reference: {
			required: true,
			type: 'string',
			minLength: 10,
			maxLength: 50,
			pattern: /^[A-Z0-9_]+$/
		},
		callback_url: {
			required: false,
			type: 'string',
			pattern: /^https?:\/\/.+/,
			custom: (value: string) => {
				if (value && !value.startsWith('http')) {
					return 'Callback URL must be a valid HTTP/HTTPS URL';
				}
				return null;
			}
		},
		metadata: {
			required: false,
			type: 'object'
		},
		channels: {
			required: false,
			type: 'object',
			custom: (value: any) => {
				if (value && !Array.isArray(value)) {
					return 'Channels must be an array';
				}
				if (value && Array.isArray(value)) {
					const validChannels = ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'];
					const invalidChannels = value.filter((channel: string) => !validChannels.includes(channel));
					if (invalidChannels.length > 0) {
						return `Invalid channels: ${invalidChannels.join(', ')}`;
					}
				}
				return null;
			}
		}
	};

	// Payment verification validation schema
	private paymentVerifySchema = {
		reference: {
			required: true,
			type: 'string',
			minLength: 10,
			maxLength: 50,
			pattern: /^[A-Z0-9_]+$/
		}
	};

	// Refund validation schema
	private refundSchema = {
		transaction: {
			required: true,
			type: 'string',
			minLength: 10,
			maxLength: 50
		},
		amount: {
			required: false,
			type: 'number',
			min: 100,
			max: 10000000,
			custom: (value: number) => {
				if (value && value % 1 !== 0) {
					return 'Refund amount must be a whole number (no decimals)';
				}
				return null;
			}
		},
		merchant_note: {
			required: false,
			type: 'string',
			maxLength: 500
		},
		customer_note: {
			required: false,
			type: 'string',
			maxLength: 500
		}
	};

	// Validate payment initialization
	validatePaymentInit = (req: Request, res: Response, next: NextFunction) => {
		const result = this.validateObject(req.body, this.paymentInitSchema);

		if (!result.isValid) {
			return res.status(400).json({
				success: false,
				message: 'Payment initialization validation failed',
				errors: result.errors
			});
		}

		req.body = result.data;
		next();
	};

	// Validate payment verification
	validatePaymentVerify = (req: Request, res: Response, next: NextFunction) => {
		const result = this.validateObject(req.body, this.paymentVerifySchema);

		if (!result.isValid) {
			return res.status(400).json({
				success: false,
				message: 'Payment verification validation failed',
				errors: result.errors
			});
		}

		req.body = result.data;
		next();
	};

	// Validate refund request
	validateRefund = (req: Request, res: Response, next: NextFunction) => {
		const result = this.validateObject(req.body, this.refundSchema);

		if (!result.isValid) {
			return res.status(400).json({
				success: false,
				message: 'Refund validation failed',
				errors: result.errors
			});
		}

		req.body = result.data;
		next();
	};

	// Validate payment reference parameter
	validatePaymentReference = (req: Request, res: Response, next: NextFunction) => {
		const { reference } = req.params;

		if (!reference || typeof reference !== 'string') {
			return res.status(400).json({
				success: false,
				message: 'Payment reference is required'
			});
		}

		if (!/^[A-Z0-9_]+$/.test(reference)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid payment reference format'
			});
		}

		if (reference.length < 10 || reference.length > 50) {
			return res.status(400).json({
				success: false,
				message: 'Payment reference must be between 10 and 50 characters'
			});
		}

		next();
	};

	// Validate payment provider
	validatePaymentProvider = (req: Request, res: Response, next: NextFunction) => {
		const { provider } = req.params;

		if (!provider) {
			return res.status(400).json({
				success: false,
				message: 'Payment provider is required'
			});
		}

		const validProviders = ['paystack', 'flutterwave'];
		if (!validProviders.includes(provider.toLowerCase())) {
			return res.status(400).json({
				success: false,
				message: 'Invalid payment provider. Must be one of: paystack, flutterwave'
			});
		}

		next();
	};

	// Validate payment callback
	validatePaymentCallback = (req: Request, res: Response, next: NextFunction) => {
		const { reference, status, transaction_id } = req.query;

		if (!reference) {
			return res.status(400).json({
				success: false,
				message: 'Payment reference is required in callback'
			});
		}

		if (!status) {
			return res.status(400).json({
				success: false,
				message: 'Payment status is required in callback'
			});
		}

		const validStatuses = ['success', 'failed', 'pending', 'cancelled'];
		if (!validStatuses.includes(status as string)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid payment status'
			});
		}

		next();
	};

	// Validate webhook signature (for production)
	validateWebhookSignature = (req: Request, res: Response, next: NextFunction) => {
		const signature = req.headers['x-paystack-signature'] || req.headers['x-flutterwave-signature'];

		if (!signature) {
			return res.status(401).json({
				success: false,
				message: 'Webhook signature is required'
			});
		}

		// In production, you would verify the signature here
		// For now, we'll just check that it exists
		next();
	};
}
