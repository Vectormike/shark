import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    setupTwoFactor,
    verifyTwoFactorSetup,
    disableTwoFactor,
    getTwoFactorStatus
} from '../controllers/twoFactorController';

const router: express.Router = express.Router();

// All 2FA routes require authentication
router.use(authenticateToken);

// Setup 2FA
router.post('/setup', setupTwoFactor);

// Verify 2FA setup
router.post('/verify', verifyTwoFactorSetup);

// Disable 2FA
router.post('/disable', disableTwoFactor);

// Get 2FA status
router.get('/status', getTwoFactorStatus);

export default router;
