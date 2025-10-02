import { Request, Response } from 'express';
import crypto from 'crypto';
import { WebhookService } from '../services/WebhookService';

const webhookService = new WebhookService();

// Webhook signature verification
const verifyPaystackSignature = (req: Request): boolean => {
	const secret = process.env.PAYSTACK_SECRET_KEY;
	if (!secret) {
		console.warn('⚠️ Paystack secret key not configured for webhook verification');
		return true; // Allow in development
	}

	const hash = crypto
		.createHmac('sha512', secret)
		.update(JSON.stringify(req.body))
		.digest('hex');

	return hash === req.headers['x-paystack-signature'];
};

const verifyFlutterwaveSignature = (req: Request): boolean => {
	const secret = process.env.FLUTTERWAVE_SECRET_KEY;
	if (!secret) {
		console.warn('⚠️ Flutterwave secret key not configured for webhook verification');
		return true; // Allow in development
	}

	const hash = crypto
		.createHmac('sha256', secret)
		.update(JSON.stringify(req.body))
		.digest('hex');

	return hash === req.headers['verif-hash'];
};

// Paystack webhook handler
export const handlePaystackWebhook = async (req: Request, res: Response) => {
	try {
		// Verify webhook signature for security
		if (!verifyPaystackSignature(req)) {
			console.error('❌ Invalid webhook signature');
			return res.status(400).json({ success: false, error: 'Invalid signature' });
		}

		const event = req.body;
		console.log('🔔 Paystack webhook received:', event.event);

		// Handle different webhook events
		switch (event.event) {
			case 'transfer.success':
				await webhookService.handleTransferSuccess(event.data.reference, event.data);
				break;

			case 'transfer.failed':
				await webhookService.handleTransferFailed(event.data.reference, event.data);
				break;

			case 'transfer.reversed':
				await webhookService.handleTransferReversed(event.data.reference, event.data);
				break;

			case 'charge.success':
				await webhookService.handlePaymentSuccess(event.data.reference, event.data);
				break;

			case 'charge.failed':
				await webhookService.handlePaymentFailed(event.data.reference, event.data);
				break;

			default:
				console.log('📝 Unhandled webhook event:', event.event);
		}

		res.status(200).json({ success: true });
	} catch (error) {
		console.error('❌ Webhook error:', error);
		res.status(400).json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		});
	}
};


// Flutterwave webhook handler
export const handleFlutterwaveWebhook = async (req: Request, res: Response) => {
	try {
		// Verify webhook signature for security
		if (!verifyFlutterwaveSignature(req)) {
			console.error('❌ Invalid Flutterwave webhook signature');
			return res.status(400).json({ success: false, error: 'Invalid signature' });
		}

		const event = req.body;
		console.log('🔔 Flutterwave webhook received:', event.event);

		// Handle different webhook events
		switch (event.event) {
			case 'transfer.completed':
				await webhookService.handleTransferSuccess(event.data.reference, event.data);
				break;

			case 'transfer.failed':
				await webhookService.handleTransferFailed(event.data.reference, event.data);
				break;

			case 'charge.completed':
				await webhookService.handlePaymentSuccess(event.data.tx_ref, event.data);
				break;

			case 'charge.failed':
				await webhookService.handlePaymentFailed(event.data.tx_ref, event.data);
				break;

			default:
				console.log('📝 Unhandled Flutterwave webhook event:', event.event);
		}

		res.status(200).json({ success: true });
	} catch (error) {
		console.error('❌ Flutterwave webhook error:', error);
		res.status(400).json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		});
	}
};

