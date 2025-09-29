import { Request, Response } from 'express';
import { LoanService } from '../services/LoanService';
import { PaymentMethod } from '../types/database';
import { paymentService, generatePaymentReference } from '../services/PaymentService';
import { BankService } from '../services/BankService';
import { db } from '../config/database';

const loanService = new LoanService();

// Create a new loan (admin only)
export const createLoan = async (req: Request, res: Response) => {
	try {
		const loanData = req.body;

		const loan = await loanService.createLoan(loanData);

		res.status(201).json({
			success: true,
			message: 'Loan created successfully',
			data: { loan }
		});
	} catch (error) {
		console.error('Create loan error:', error);
		res.status(400).json({
			success: false,
			message: error instanceof Error ? error.message : 'Internal server error'
		});
	}
};

// Get all loans (admin only)
export const getLoans = async (req: Request, res: Response) => {
	try {
		const { page = 1, limit = 10, status, borrower_id } = req.query;

		const result = await loanService.getLoans({
			page: Number(page),
			limit: Number(limit),
			status: status as string,
			borrower_id: borrower_id as string
		});

		res.json({
			success: true,
			data: result
		});
	} catch (error) {
		console.error('Get loans error:', error);
		res.status(500).json({
			success: false,
			message: 'Internal server error'
		});
	}
};

// Get loan by ID (admin only)
export const getLoanById = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;

		const loan = await loanService.getLoanById(id);

		res.json({
			success: true,
			data: { loan }
		});
	} catch (error) {
		console.error('Get loan by id error:', error);
		res.status(404).json({
			success: false,
			message: error instanceof Error ? error.message : 'Loan not found'
		});
	}
};

// Update loan (admin only)
export const updateLoan = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const updates = req.body;

		const loan = await loanService.updateLoan(id, updates);

		res.json({
			success: true,
			message: 'Loan updated successfully',
			data: { loan }
		});
	} catch (error) {
		console.error('Update loan error:', error);
		res.status(400).json({
			success: false,
			message: error instanceof Error ? error.message : 'Internal server error'
		});
	}
};

// Delete loan (admin only)
export const deleteLoan = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;

		await loanService.deleteLoan(id);

		res.json({
			success: true,
			message: 'Loan deleted successfully'
		});
	} catch (error) {
		console.error('Delete loan error:', error);
		res.status(400).json({
			success: false,
			message: error instanceof Error ? error.message : 'Internal server error'
		});
	}
};

// Approve loan (admin only)
export const approveLoan = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;

		const loan = await loanService.approveLoan(id);

		res.json({
			success: true,
			message: 'Loan approved successfully',
			data: { loan }
		});
	} catch (error) {
		console.error('Approve loan error:', error);
		res.status(400).json({
			success: false,
			message: error instanceof Error ? error.message : 'Internal server error'
		});
	}
};

// Disburse loan (admin only)
export const disburseLoan = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const disbursementData = req.body; // Optional disbursement data

		const loan = await loanService.disburseLoan(id, disbursementData);

		res.json({
			success: true,
			message: 'Loan disbursed successfully',
			data: { loan }
		});
	} catch (error) {
		console.error('Disburse loan error:', error);
		res.status(400).json({
			success: false,
			message: error instanceof Error ? error.message : 'Internal server error'
		});
	}
};

// Process repayment (admin only)
export const processRepayment = async (req: Request, res: Response) => {
	try {
		const { id: loanId } = req.params;
		const { amount, method = PaymentMethod.PAYSTACK } = req.body;

		// Get loan details
		const loan = await loanService.getLoanById(loanId);

		if (loan.status !== 'ACTIVE' && loan.status !== 'DISBURSED') {
			return res.status(400).json({
				success: false,
				message: 'Loan is not active for repayments'
			});
		}

		// Get borrower details for payment
		const borrower = await loanService.getLoanById(loanId); // This will include borrower info

		if (!borrower) {
			return res.status(404).json({
				success: false,
				message: 'Borrower not found'
			});
		}

		// Generate payment reference
		const reference = generatePaymentReference('RPY');

		// Initialize payment with gateway
		const paymentResult = await paymentService.initializePayment({
			amount,
			email: borrower.email || `${borrower.phone}@temp.com`, // Use phone as email if no email
			reference,
			callback_url: `${process.env.APP_URL}/api/payments/callback`,
			metadata: {
				loan_id: loanId,
				borrower_id: loan.borrower_id,
				type: 'repayment'
			}
		});

		if (!paymentResult.success) {
			return res.status(400).json({
				success: false,
				message: 'Payment initialization failed',
				error: paymentResult.message
			});
		}

		// Create repayment record
		const principalAmount = amount * 0.8; // Simple calculation - adjust based on your business logic
		const interestAmount = amount * 0.2;

		const [repayment] = await db('repayments')
			.insert({
				loan_id: loanId,
				borrower_id: loan.borrower_id,
				amount,
				principal_amount: principalAmount,
				interest_amount: interestAmount,
				method,
				transaction_reference: reference,
				due_date: new Date(),
				status: 'PENDING'
			})
			.returning('*');

		res.json({
			success: true,
			message: 'Payment initialized successfully',
			data: {
				repayment,
				payment_url: paymentResult.authorization_url,
				reference
			}
		});
	} catch (error) {
		console.error('Process repayment error:', error);
		res.status(500).json({
			success: false,
			message: 'Internal server error'
		});
	}
};

// Get supported banks for disbursement
export const getSupportedBanks = async (req: Request, res: Response) => {
	try {
		const banks = await BankService.getSupportedBanks();

		res.json({
			success: true,
			message: 'Supported banks retrieved successfully',
			data: { banks }
		});
	} catch (error) {
		console.error('Get banks error:', error);
		res.status(500).json({
			success: false,
			message: error instanceof Error ? error.message : 'Internal server error'
		});
	}
};
