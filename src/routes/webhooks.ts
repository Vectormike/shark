import { Router } from 'express';
import { handlePaystackWebhook } from '../controllers/webhookController';

const router: Router = Router();

// Paystack webhook endpoint
router.post('/paystack', handlePaystackWebhook);

export default router;
