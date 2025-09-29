import { LoanRepository } from '../repositories/LoanRepository';
import { UserRepository } from '../repositories/UserRepository';
import { Loan, LoanStatus, CreateLoanInput } from '../types/database';
import { CacheService, CacheKeys } from '../config/redis';

export class LoanService {
	private loanRepository: LoanRepository;
	private userRepository: UserRepository;

	constructor() {
		this.loanRepository = new LoanRepository();
		this.userRepository = new UserRepository();
	}

	// Calculate loan details
	private calculateLoanDetails(amount: number, interestRate: number, termInMonths: number) {
		const monthlyInterestRate = interestRate / 100 / 12;
		const monthlyPayment = (amount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, termInMonths)) /
			(Math.pow(1 + monthlyInterestRate, termInMonths) - 1);
		const totalAmount = monthlyPayment * termInMonths;

		return {
			monthlyPayment: Math.round(monthlyPayment * 100) / 100,
			totalAmount: Math.round(totalAmount * 100) / 100,
			remainingBalance: amount
		};
	}

	// Create a new loan
	async createLoan(data: CreateLoanInput): Promise<Loan> {
		// Validate borrower exists
		const borrower = await this.userRepository.findBorrowerById(data.borrower_id);
		if (!borrower || !borrower.is_active) {
			throw new Error('Borrower not found or inactive');
		}

		// Calculate loan details
		const loanDetails = this.calculateLoanDetails(
			data.amount,
			data.interest_rate,
			data.term_in_months
		);

		// Create loan
		const loan = await this.loanRepository.create({
			user_id: data.borrower_id,
			amount: data.amount,
			interest_rate: data.interest_rate,
			term_in_months: data.term_in_months,
			purpose: data.purpose,
			...loanDetails,
			status: LoanStatus.PENDING
		});

		// Clear borrower loans cache
		await CacheService.delete(CacheKeys.USER_LOANS(data.borrower_id));
		await CacheService.delete(CacheKeys.BORROWER_LOANS(data.borrower_id));

		return loan;
	}

	// Get all loans with borrower information
	async getLoans(options: {
		page?: number;
		limit?: number;
		status?: string;
		borrower_id?: string;
	} = {}): Promise<{
		loans: any[];
		pagination: {
			page: number;
			limit: number;
			total: number;
			pages: number;
		};
	}> {
		const { page = 1, limit = 10, status, borrower_id } = options;

		const result = await this.loanRepository.findLoansWithBorrowers({
			page,
			limit,
			status,
			borrower_id
		});

		return {
			loans: result.data,
			pagination: {
				page,
				limit,
				total: result.total,
				pages: Math.ceil(result.total / limit)
			}
		};
	}

	// Get loan by ID with borrower information
	async getLoanById(id: string): Promise<any> {
		// Try cache first
		const cachedLoan = await CacheService.get(CacheKeys.LOAN_DETAILS(id));
		if (cachedLoan) {
			return cachedLoan;
		}

		const loan = await this.loanRepository.findLoanWithBorrowerById(id);
		if (!loan) {
			throw new Error('Loan not found');
		}

		// Cache for 5 minutes
		await CacheService.set(CacheKeys.LOAN_DETAILS(id), loan, 300);

		return loan;
	}

	// Update loan
	async updateLoan(id: string, updates: Partial<Loan>): Promise<Loan> {
		// Check if loan exists
		const existingLoan = await this.loanRepository.findById(id);
		if (!existingLoan) {
			throw new Error('Loan not found');
		}

		// Only allow updates for pending loans
		if (existingLoan.status !== LoanStatus.PENDING) {
			throw new Error('Can only update pending loans');
		}

		// Recalculate loan details if amount, rate, or term changed
		if (updates.amount || updates.interest_rate || updates.term_in_months) {
			const loanDetails = this.calculateLoanDetails(
				updates.amount || existingLoan.amount,
				updates.interest_rate || existingLoan.interest_rate,
				updates.term_in_months || existingLoan.term_in_months
			);
			Object.assign(updates, loanDetails);
		}

		const updatedLoan = await this.loanRepository.update(id, updates);
		if (!updatedLoan) {
			throw new Error('Failed to update loan');
		}

		// Clear cache
		await CacheService.delete(CacheKeys.LOAN_DETAILS(id));
		await CacheService.delete(CacheKeys.USER_LOANS(existingLoan.user_id));
		await CacheService.delete(CacheKeys.BORROWER_LOANS(existingLoan.user_id));

		return updatedLoan;
	}

	// Delete loan
	async deleteLoan(id: string): Promise<void> {
		// Check if loan exists
		const existingLoan = await this.loanRepository.findById(id);
		if (!existingLoan) {
			throw new Error('Loan not found');
		}

		// Only allow deletion of pending loans
		if (existingLoan.status !== LoanStatus.PENDING) {
			throw new Error('Can only delete pending loans');
		}

		await this.loanRepository.delete(id);

		// Clear cache
		await CacheService.delete(CacheKeys.LOAN_DETAILS(id));
		await CacheService.delete(CacheKeys.USER_LOANS(existingLoan.user_id));
		await CacheService.delete(CacheKeys.BORROWER_LOANS(existingLoan.user_id));
	}

	// Approve loan
	async approveLoan(id: string): Promise<Loan> {
		const loan = await this.loanRepository.updateStatus(id, LoanStatus.APPROVED);
		if (!loan) {
			throw new Error('Loan not found');
		}

		// Clear cache
		await CacheService.delete(CacheKeys.LOAN_DETAILS(id));
		await CacheService.delete(CacheKeys.USER_LOANS(loan.user_id));
		await CacheService.delete(CacheKeys.BORROWER_LOANS(loan.user_id));

		return loan;
	}

	// Disburse loan
	async disburseLoan(id: string): Promise<Loan> {
		const loan = await this.loanRepository.updateStatus(id, LoanStatus.DISBURSED);
		if (!loan) {
			throw new Error('Loan not found');
		}

		// Clear cache
		await CacheService.delete(CacheKeys.LOAN_DETAILS(id));
		await CacheService.delete(CacheKeys.USER_LOANS(loan.user_id));
		await CacheService.delete(CacheKeys.BORROWER_LOANS(loan.user_id));

		return loan;
	}

	// Get loan statistics
	async getLoanStats(): Promise<any> {
		return await this.loanRepository.getLoanStats();
	}

	// Get loans by borrower
	async getLoansByBorrower(borrowerId: string): Promise<Loan[]> {
		return await this.loanRepository.findByBorrowerId(borrowerId);
	}
}
