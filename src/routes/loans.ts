import { Router } from 'express';
import {
	createLoan,
	getLoans,
	getLoanById,
	updateLoan,
	deleteLoan,
	approveLoan,
	disburseLoan,
	processRepayment
} from '../controllers/loanController';
import { authenticateToken } from '../middleware/auth';

const router: Router = Router();

router.use(authenticateToken);

router.post('/', createLoan);
router.get('/', getLoans);
router.get('/:id', getLoanById);
router.put('/:id', updateLoan);
router.delete('/:id', deleteLoan);
router.patch('/:id/approve', approveLoan);
router.patch('/:id/disburse', disburseLoan);
router.post('/:id/repayment', processRepayment);

export default router;
