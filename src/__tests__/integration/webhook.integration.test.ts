import request from 'supertest';
import express from 'express';
import crypto from 'crypto';
import webhookRoutes from '../../routes/webhooks';

describe('Webhook Integration Tests', () => {
	let app: express.Application;

	beforeEach(() => {
		app = express();
		app.use(express.json());
		app.use('/api/webhooks', webhookRoutes);
	});

	describe('Webhook Routes', () => {
		it('should handle Paystack webhook endpoint', async () => {
			const payload = {
				event: 'transfer.success',
				data: { reference: 'test-ref' },
			};

			const signature = crypto
				.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || 'test-secret')
				.update(JSON.stringify(payload))
				.digest('hex');

			const response = await request(app)
				.post('/api/webhooks/paystack')
				.set('x-paystack-signature', signature)
				.send(payload)
				.expect(200);

			expect(response.body.success).toBe(true);
		});

		it('should handle Flutterwave webhook endpoint', async () => {
			const payload = {
				event: 'transfer.completed',
				data: { reference: 'test-ref' },
			};

			const signature = crypto
				.createHmac('sha256', process.env.FLUTTERWAVE_SECRET_KEY || 'test-secret')
				.update(JSON.stringify(payload))
				.digest('hex');

			const response = await request(app)
				.post('/api/webhooks/flutterwave')
				.set('verif-hash', signature)
				.send(payload)
				.expect(200);

			expect(response.body.success).toBe(true);
		});

		it('should return 404 for unknown webhook endpoints', async () => {
			await request(app)
				.post('/api/webhooks/unknown')
				.send({})
				.expect(404);
		});
	});
});
