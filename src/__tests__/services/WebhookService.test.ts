import { WebhookService } from '../../services/WebhookService';
import { RepaymentRepository } from '../../repositories/RepaymentRepository';
import { LoanRepository } from '../../repositories/LoanRepository';
import { RepaymentStatus, LoanStatus } from '../../types/database';
import { beforeEach } from 'node:test';

// Mock the repositories
jest.mock('../../repositories/RepaymentRepository');
jest.mock('../../repositories/LoanRepository');

describe('WebhookService', () => {
	let webhookService: WebhookService;
	let mockRepaymentRepo: jest.Mocked<RepaymentRepository>;
	let mockLoanRepo: jest.Mocked<LoanRepository>;

	beforeEach(() => {
		jest.clearAllMocks();
		webhookService = new WebhookService();
		mockRepaymentRepo = webhookService['repaymentRepo'] as jest.Mocked<RepaymentRepository>;
		mockLoanRepo = webhookService['loanRepo'] as jest.Mocked<LoanRepository>;
	});

	describe('handleTransferSuccess', () => {
		it('should update loan status to DISBURSED when transfer is successful', async () => {
			const mockLoan = {
				id: 'loan-123',
				borrower_id: 'borrower-123',
				amount: 10000,
				status: LoanStatus.APPROVED,
			};

			mockLoanRepo.findByDisbursementReference.mockResolvedValue(mockLoan as any);
			mockLoanRepo.updateStatus.mockResolvedValue(mockLoan as any);

			await webhookService.handleTransferSuccess('transfer-ref-123', { reference: 'transfer-ref-123' });

			expect(mockLoanRepo.findByDisbursementReference).toHaveBeenCalledWith('transfer-ref-123');
			expect(mockLoanRepo.updateStatus).toHaveBeenCalledWith(
				'loan-123',
				LoanStatus.DISBURSED,
				{ disbursement_gateway_response: { reference: 'transfer-ref-123' } }
			);
		});

		it('should log warning when loan is not found', async () => {
			mockLoanRepo.findByDisbursementReference.mockResolvedValue(null);

			await webhookService.handleTransferSuccess('invalid-ref', {});

			expect(mockLoanRepo.findByDisbursementReference).toHaveBeenCalledWith('invalid-ref');
			expect(mockLoanRepo.updateStatus).not.toHaveBeenCalled();
		});
	});

	describe('handleTransferFailed', () => {
		it('should revert loan status to APPROVED when transfer fails', async () => {
			const mockLoan = {
				id: 'loan-123',
				borrower_id: 'borrower-123',
				amount: 10000,
				status: LoanStatus.APPROVED,
			};

			mockLoanRepo.findByDisbursementReference.mockResolvedValue(mockLoan as any);
			mockLoanRepo.updateStatus.mockResolvedValue(mockLoan as any);

			await webhookService.handleTransferFailed('transfer-ref-123', { reference: 'transfer-ref-123' });

			expect(mockLoanRepo.findByDisbursementReference).toHaveBeenCalledWith('transfer-ref-123');
			expect(mockLoanRepo.updateStatus).toHaveBeenCalledWith(
				'loan-123',
				LoanStatus.APPROVED,
				{ disbursement_gateway_response: { reference: 'transfer-ref-123' } }
			);
		});
	});

	describe('handlePaymentSuccess', () => {
		it('should update repayment status to COMPLETED when payment is successful', async () => {
			const mockRepayment = {
				id: 'repayment-123',
				loan_id: 'loan-123',
				borrower_id: 'borrower-123',
				amount: 1000,
				status: RepaymentStatus.PENDING,
			};

			const mockLoan = {
				id: 'loan-123',
				borrower_id: 'borrower-123',
				amount: 10000,
				status: LoanStatus.ACTIVE,
			};

			mockRepaymentRepo.findByTransactionReference.mockResolvedValue(mockRepayment as any);
			mockRepaymentRepo.updateStatus.mockResolvedValue(mockRepayment as any);
			mockRepaymentRepo.getTotalRepaymentsByLoanId.mockResolvedValue({
				totalAmount: 10000,
				totalPrincipal: 9000,
				totalInterest: 1000,
				completedCount: 10,
			});
			mockLoanRepo.findById.mockResolvedValue(mockLoan as any);
			mockLoanRepo.updateStatus.mockResolvedValue(mockLoan as any);

			await webhookService.handlePaymentSuccess('payment-ref-123', { reference: 'payment-ref-123' });

			expect(mockRepaymentRepo.findByTransactionReference).toHaveBeenCalledWith('payment-ref-123');
			expect(mockRepaymentRepo.updateStatus).toHaveBeenCalledWith(
				'repayment-123',
				RepaymentStatus.COMPLETED,
				{
					gateway_response: { reference: 'payment-ref-123' },
					paid_at: expect.any(Date),
				}
			);
			expect(mockLoanRepo.updateStatus).toHaveBeenCalledWith('loan-123', LoanStatus.COMPLETED);
		});

		it('should update next payment date if loan is not fully paid', async () => {
			const mockRepayment = {
				id: 'repayment-123',
				loan_id: 'loan-123',
				borrower_id: 'borrower-123',
				amount: 1000,
				status: RepaymentStatus.PENDING,
			};

			const mockLoan = {
				id: 'loan-123',
				borrower_id: 'borrower-123',
				amount: 10000,
				status: LoanStatus.ACTIVE,
			};

			mockRepaymentRepo.findByTransactionReference.mockResolvedValue(mockRepayment as any);
			mockRepaymentRepo.updateStatus.mockResolvedValue(mockRepayment as any);
			mockRepaymentRepo.getTotalRepaymentsByLoanId.mockResolvedValue({
				totalAmount: 5000, // Less than loan amount
				totalPrincipal: 4500,
				totalInterest: 500,
				completedCount: 5,
			});
			mockLoanRepo.findById.mockResolvedValue(mockLoan as any);
			mockLoanRepo.update.mockResolvedValue(mockLoan as any);

			await webhookService.handlePaymentSuccess('payment-ref-123', { reference: 'payment-ref-123' });

			expect(mockLoanRepo.update).toHaveBeenCalledWith('loan-123', {
				next_payment_date: expect.any(Date),
			});
			expect(mockLoanRepo.updateStatus).not.toHaveBeenCalledWith('loan-123', LoanStatus.COMPLETED);
		});
	});

	describe('handlePaymentFailed', () => {
		it('should update repayment status to FAILED when payment fails', async () => {
			const mockRepayment = {
				id: 'repayment-123',
				loan_id: 'loan-123',
				borrower_id: 'borrower-123',
				amount: 1000,
				status: RepaymentStatus.PENDING,
			};

			mockRepaymentRepo.findByTransactionReference.mockResolvedValue(mockRepayment as any);
			mockRepaymentRepo.updateStatus.mockResolvedValue(mockRepayment as any);

			await webhookService.handlePaymentFailed('payment-ref-123', { reference: 'payment-ref-123' });

			expect(mockRepaymentRepo.findByTransactionReference).toHaveBeenCalledWith('payment-ref-123');
			expect(mockRepaymentRepo.updateStatus).toHaveBeenCalledWith(
				'repayment-123',
				RepaymentStatus.FAILED,
				{ gateway_response: { reference: 'payment-ref-123' } }
			);
		});
	});
});
