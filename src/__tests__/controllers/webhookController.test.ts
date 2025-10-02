import request from 'supertest';
import express from 'express';
import crypto from 'crypto';
import { handlePaystackWebhook, handleFlutterwaveWebhook } from '../../controllers/webhookController';
import { WebhookService } from '../../services/WebhookService';

// Mock the WebhookService
jest.mock('../../services/WebhookService');

describe('Webhook Controllers', () => {
	let app: express.Application;
	let mockWebhookService: jest.Mocked<WebhookService>;

	beforeEach(() => {
		jest.clearAllMocks();
		app = express();
		app.use(express.json());

		mockWebhookService = new WebhookService() as jest.Mocked<WebhookService>;
		(WebhookService as jest.MockedClass<typeof WebhookService>).mockImplementation(() => mockWebhookService);
	});

	describe('Paystack Webhook', () => {
		beforeEach(() => {
			app.post('/webhooks/paystack', handlePaystackWebhook);
		});

		it('should handle transfer.success event', async () => {
			const payload = {
				event: 'transfer.success',
				data: {
					reference: 'transfer-ref-123',
					status: 'success',
				},
			};

			const signature = crypto
				.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || 'test-secret')
				.update(JSON.stringify(payload))
				.digest('hex');

			const response = await request(app)
				.post('/webhooks/paystack')
				.set('x-paystack-signature', signature)
				.send(payload)
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(mockWebhookService.handleTransferSuccess).toHaveBeenCalledWith(
				'transfer-ref-123',
				payload.data
			);
		});

		it('should handle charge.success event', async () => {
			const payload = {
				event: 'charge.success',
				data: {
					reference: 'payment-ref-123',
					status: 'success',
				},
			};

			const signature = crypto
				.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || 'test-secret')
				.update(JSON.stringify(payload))
				.digest('hex');

			const response = await request(app)
				.post('/webhooks/paystack')
				.set('x-paystack-signature', signature)
				.send(payload)
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(mockWebhookService.handlePaymentSuccess).toHaveBeenCalledWith(
				'payment-ref-123',
				payload.data
			);
		});

		it('should reject webhook with invalid signature', async () => {
			const payload = {
				event: 'transfer.success',
				data: { reference: 'transfer-ref-123' },
			};

			const response = await request(app)
				.post('/webhooks/paystack')
				.set('x-paystack-signature', 'invalid-signature')
				.send(payload)
				.expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.error).toBe('Invalid signature');
			expect(mockWebhookService.handleTransferSuccess).not.toHaveBeenCalled();
		});

		it('should handle unknown events gracefully', async () => {
			const payload = {
				event: 'unknown.event',
				data: { reference: 'test-ref' },
			};

			const signature = crypto
				.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || 'test-secret')
				.update(JSON.stringify(payload))
				.digest('hex');

			const response = await request(app)
				.post('/webhooks/paystack')
				.set('x-paystack-signature', signature)
				.send(payload)
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(mockWebhookService.handleTransferSuccess).not.toHaveBeenCalled();
		});
	});

	describe('Flutterwave Webhook', () => {
		beforeEach(() => {
			app.post('/webhooks/flutterwave', handleFlutterwaveWebhook);
		});

		it('should handle transfer.completed event', async () => {
			const payload = {
				event: 'transfer.completed',
				data: {
					reference: 'transfer-ref-123',
					status: 'completed',
				},
			};

			const signature = crypto
				.createHmac('sha256', process.env.FLUTTERWAVE_SECRET_KEY || 'test-secret')
				.update(JSON.stringify(payload))
				.digest('hex');

			const response = await request(app)
				.post('/webhooks/flutterwave')
				.set('verif-hash', signature)
				.send(payload)
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(mockWebhookService.handleTransferSuccess).toHaveBeenCalledWith(
				'transfer-ref-123',
				payload.data
			);
		});

		it('should handle charge.completed event', async () => {
			const payload = {
				event: 'charge.completed',
				data: {
					tx_ref: 'payment-ref-123',
					status: 'successful',
				},
			};

			const signature = crypto
				.createHmac('sha256', process.env.FLUTTERWAVE_SECRET_KEY || 'test-secret')
				.update(JSON.stringify(payload))
				.digest('hex');

			const response = await request(app)
				.post('/webhooks/flutterwave')
				.set('verif-hash', signature)
				.send(payload)
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(mockWebhookService.handlePaymentSuccess).toHaveBeenCalledWith(
				'payment-ref-123',
				payload.data
			);
		});

		it('should reject webhook with invalid signature', async () => {
			const payload = {
				event: 'transfer.completed',
				data: { reference: 'transfer-ref-123' },
			};

			const response = await request(app)
				.post('/webhooks/flutterwave')
				.set('verif-hash', 'invalid-signature')
				.send(payload)
				.expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.error).toBe('Invalid signature');
			expect(mockWebhookService.handleTransferSuccess).not.toHaveBeenCalled();
		});
	});
});
