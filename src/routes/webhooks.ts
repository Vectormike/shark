import { Router } from 'express';
import { handlePaystackWebhook, handleFlutterwaveWebhook } from '../controllers/webhookController';

const router: Router = Router();

// Paystack webhook endpoint
router.post('/paystack', handlePaystackWebhook);

// Flutterwave webhook endpoint
router.post('/flutterwave', handleFlutterwaveWebhook);

export default router;
