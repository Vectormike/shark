import { RepaymentRepository } from '../repositories/RepaymentRepository';
import { LoanRepository } from '../repositories/LoanRepository';
import { RepaymentStatus, LoanStatus } from '../types/database';

export class WebhookService {
	private repaymentRepo: RepaymentRepository;
	private loanRepo: LoanRepository;

	constructor() {
		this.repaymentRepo = new RepaymentRepository();
		this.loanRepo = new LoanRepository();
	}

	// Handle successful loan disbursement (transfer success)
	async handleTransferSuccess(reference: string, gatewayData: any): Promise<void> {
		console.log('✅ Transfer successful:', reference);

		const loan = await this.loanRepo.findByDisbursementReference(reference);

		if (!loan) {
			console.warn('⚠️ Loan not found for transfer reference:', reference);
			return;
		}

		// Update loan status to DISBURSED
		await this.loanRepo.updateStatus(loan.id, LoanStatus.DISBURSED, {
			disbursement_gateway_response: gatewayData
		});

		console.log('✅ Loan disbursed successfully:', loan.id);
	}

	// Handle failed loan disbursement (transfer failed)
	async handleTransferFailed(reference: string, gatewayData: any): Promise<void> {
		console.log('❌ Transfer failed:', reference);

		const loan = await this.loanRepo.findByDisbursementReference(reference);

		if (!loan) {
			console.warn('⚠️ Loan not found for transfer reference:', reference);
			return;
		}

		// Update loan status back to APPROVED (ready for retry)
		await this.loanRepo.updateStatus(loan.id, LoanStatus.APPROVED, {
			disbursement_gateway_response: gatewayData
		});

		console.log('🔄 Loan status reverted to APPROVED:', loan.id);
	}

	// Handle reversed loan disbursement (transfer reversed)
	async handleTransferReversed(reference: string, gatewayData: any): Promise<void> {
		console.log('🔄 Transfer reversed:', reference);

		const loan = await this.loanRepo.findByDisbursementReference(reference);

		if (!loan) {
			console.warn('⚠️ Loan not found for transfer reference:', reference);
			return;
		}

		// Update loan status to CANCELLED
		await this.loanRepo.updateStatus(loan.id, LoanStatus.CANCELLED, {
			disbursement_gateway_response: gatewayData
		});

		console.log('🔄 Loan cancelled due to transfer reversal:', loan.id);
	}

	// Handle successful repayment (payment success)
	async handlePaymentSuccess(reference: string, gatewayData: any): Promise<void> {
		console.log('✅ Payment successful:', reference);

		const repayment = await this.repaymentRepo.findByTransactionReference(reference);

		if (!repayment) {
			console.warn('⚠️ Repayment not found for reference:', reference);
			return;
		}

		// Update repayment status to COMPLETED
		await this.repaymentRepo.updateStatus(repayment.id, RepaymentStatus.COMPLETED, {
			gateway_response: gatewayData,
			paid_at: new Date()
		});

		// Update loan status if this was the final payment
		await this.updateLoanStatusAfterPayment(repayment.loan_id);

		console.log('✅ Repayment completed successfully:', repayment.id);
	}

	// Handle failed repayment (payment failed)
	async handlePaymentFailed(reference: string, gatewayData: any): Promise<void> {
		console.log('❌ Payment failed:', reference);

		const repayment = await this.repaymentRepo.findByTransactionReference(reference);

		if (!repayment) {
			console.warn('⚠️ Repayment not found for reference:', reference);
			return;
		}

		// Update repayment status to FAILED
		await this.repaymentRepo.updateStatus(repayment.id, RepaymentStatus.FAILED, {
			gateway_response: gatewayData
		});

		console.log('❌ Repayment marked as failed:', repayment.id);
	}

	// Update loan status after successful payment
	private async updateLoanStatusAfterPayment(loanId: string): Promise<void> {
		try {
			const loan = await this.loanRepo.findById(loanId);
			if (!loan) return;

			// Get total repayments for this loan
			const repaymentStats = await this.repaymentRepo.getTotalRepaymentsByLoanId(loanId);

			// Check if loan is fully paid
			if (repaymentStats.totalAmount >= loan.amount) {
				await this.loanRepo.updateStatus(loanId, LoanStatus.COMPLETED);
				console.log('🎉 Loan completed:', loanId);
			} else {
				// Update next payment date if there are more payments due
				const nextPaymentDate = new Date();
				nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1); // Assuming monthly payments

				await this.loanRepo.update(loanId, {
					next_payment_date: nextPaymentDate
				});
			}
		} catch (error) {
			console.error('❌ Error updating loan status after payment:', error);
		}
	}
}
