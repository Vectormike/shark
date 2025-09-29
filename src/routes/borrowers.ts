import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { borrowerValidator } from '../validators';
import {
    createBorrower,
    getBorrowers,
    getBorrowerById,
    updateBorrower,
    deactivateBorrower,
    reactivateBorrower
} from '../controllers/borrowerController';

const router: express.Router = express.Router();

// All borrower routes require admin authentication
router.use(authenticateToken);

// Create a new borrower
router.post('/',
    borrowerValidator.validateCreateBorrower,
    createBorrower
);

// Get all borrowers with pagination and search
router.get('/',
    borrowerValidator.validateSearchBorrowers,
    getBorrowers
);

// Get borrower by ID
router.get('/:id',
    borrowerValidator.validateBorrowerId,
    getBorrowerById
);

// Update borrower
router.put('/:id',
    borrowerValidator.validateBorrowerId,
    borrowerValidator.validateUpdateBorrower,
    updateBorrower
);

// Deactivate borrower
router.patch('/:id/deactivate',
    borrowerValidator.validateBorrowerId,
    borrowerValidator.validateDeactivateBorrower,
    deactivateBorrower
);

// Reactivate borrower
router.patch('/:id/reactivate',
    borrowerValidator.validateBorrowerId,
    reactivateBorrower
);

export default router;
