import { BaseRepository } from './BaseRepository';
import { Repayment, RepaymentStatus } from '../types/database';
import { db } from '../config/database';

export class RepaymentRepository extends BaseRepository<Repayment> {
	constructor() {
		super('repayments');
	}

	// Find repayments by loan ID
	async findByLoanId(loanId: string): Promise<Repayment[]> {
		return await db('repayments')
			.where('loan_id', loanId)
			.orderBy('created_at', 'desc');
	}

	// Find repayments by user ID
	async findByUserId(userId: string): Promise<Repayment[]> {
		return await db('repayments')
			.where('user_id', userId)
			.orderBy('created_at', 'desc');
	}

	// Find repayments by status
	async findByStatus(status: RepaymentStatus): Promise<Repayment[]> {
		return await db('repayments')
			.where('status', status)
			.orderBy('created_at', 'desc');
	}

	// Find repayment by transaction reference
	async findByTransactionReference(reference: string): Promise<Repayment | null> {
		const repayment = await db('repayments')
			.where('transaction_reference', reference)
			.first();
		return repayment || null;
	}

	// Update repayment status
	async updateStatus(id: string, status: RepaymentStatus, additionalData?: Partial<Repayment>): Promise<Repayment | null> {
		const updateData: any = {
			status,
			updated_at: new Date()
		};

		if (status === RepaymentStatus.COMPLETED) {
			updateData.paid_at = new Date();
		}

		if (additionalData) {
			Object.assign(updateData, additionalData);
		}

		const [repayment] = await db('repayments')
			.where('id', id)
			.update(updateData)
			.returning('*');

		return repayment || null;
	}

	// Get total repayments for a loan
	async getTotalRepaymentsByLoanId(loanId: string): Promise<{
		totalAmount: number;
		totalPrincipal: number;
		totalInterest: number;
		completedCount: number;
	}> {
		const result = await db('repayments')
			.where('loan_id', loanId)
			.where('status', RepaymentStatus.COMPLETED)
			.select(
				db.raw('COALESCE(SUM(amount), 0) as total_amount'),
				db.raw('COALESCE(SUM(principal_amount), 0) as total_principal'),
				db.raw('COALESCE(SUM(interest_amount), 0) as total_interest'),
				db.raw('COUNT(*) as completed_count')
			)
			.first();

		return {
			totalAmount: Number(result?.total_amount || 0),
			totalPrincipal: Number(result?.total_principal || 0),
			totalInterest: Number(result?.total_interest || 0),
			completedCount: Number(result?.completed_count || 0)
		};
	}

	// Get repayment statistics
	async getRepaymentStats(): Promise<{
		total: number;
		pending: number;
		completed: number;
		failed: number;
		overdue: number;
	}> {
		const stats = await db('repayments')
			.select('status')
			.count('* as count')
			.groupBy('status');

		const result = {
			total: 0,
			pending: 0,
			completed: 0,
			failed: 0,
			overdue: 0
		};

		stats.forEach(stat => {
			result.total += Number(stat.count);
			result[String(stat.status).toLowerCase() as keyof typeof result] = Number(stat.count);
		});

		return result;
	}
}
