import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    createBorrower,
    getBorrowers,
    getBorrowerById,
    updateBorrower,
    deactivateBorrower
} from '../controllers/borrowerController';

const router: express.Router = express.Router();

// All borrower routes require admin authentication
router.use(authenticateToken);

// Create a new borrower
router.post('/', createBorrower);

// Get all borrowers with pagination and search
router.get('/', getBorrowers);

// Get borrower by ID
router.get('/:id', getBorrowerById);

// Update borrower
router.put('/:id', updateBorrower);

// Deactivate borrower
router.patch('/:id/deactivate', deactivateBorrower);

export default router;
