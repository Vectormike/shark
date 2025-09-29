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
import { loanValidator } from '../validators';

const router: Router = Router();

router.use(authenticateToken);

router.post('/',
	loanValidator.validateCreateLoan,
	createLoan
);
router.get('/',
	loanValidator.validateLoanQuery,
	getLoans
);
router.get('/:id',
	loanValidator.validateLoanId,
	getLoanById
);
router.put('/:id',
	loanValidator.validateLoanId,
	loanValidator.validateUpdateLoan,
	updateLoan
);
router.delete('/:id',
	loanValidator.validateLoanId,
	deleteLoan
);
router.patch('/:id/approve',
	loanValidator.validateLoanId,
	approveLoan
);
router.patch('/:id/disburse',
	loanValidator.validateLoanId,
	disburseLoan
);
router.post('/:id/repayment',
	loanValidator.validateLoanId,
	loanValidator.validateRepayment,
	processRepayment
);

export default router;
