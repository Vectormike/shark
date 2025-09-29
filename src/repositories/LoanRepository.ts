import { BaseRepository } from './BaseRepository';
import { Loan, LoanStatus } from '../types/database';
import { db } from '../config/database';

export class LoanRepository extends BaseRepository<Loan> {
	constructor() {
		super('loans');
	}

	// Find loans with borrower information
	async findLoansWithBorrowers(options: {
		page?: number;
		limit?: number;
		status?: string;
		borrower_id?: string;
	} = {}): Promise<{ data: any[]; total: number }> {
		const { page = 1, limit = 10, status, borrower_id } = options;
		const offset = (page - 1) * limit;

		let query = db('loans')
			.join('users', 'loans.user_id', 'users.id')
			.select(
				'loans.*',
				'users.first_name',
				'users.last_name',
				'users.phone',
				'users.nin'
			)
			.orderBy('loans.created_at', 'desc');

		// Filter by borrower if specified
		if (borrower_id) {
			query = query.where('loans.user_id', borrower_id);
		}

		if (status) {
			query = query.where('loans.status', status);
		}

		const [data, totalCount] = await Promise.all([
			query.limit(limit).offset(offset),
			db('loans').count('* as count').first()
		]);

		return {
			data,
			total: Number(totalCount?.count || 0)
		};
	}

	// Find loan with borrower information by ID
	async findLoanWithBorrowerById(id: string): Promise<any | null> {
		const loan = await db('loans')
			.join('users', 'loans.user_id', 'users.id')
			.select(
				'loans.*',
				'users.first_name',
				'users.last_name',
				'users.phone',
				'users.nin',
				'users.address'
			)
			.where('loans.id', id)
			.first();
		return loan || null;
	}

	// Find loans by borrower ID
	async findByBorrowerId(borrowerId: string): Promise<Loan[]> {
		return await db('loans')
			.where('user_id', borrowerId)
			.orderBy('created_at', 'desc');
	}

	// Find loans by status
	async findByStatus(status: LoanStatus): Promise<Loan[]> {
		return await db('loans')
			.where('status', status)
			.orderBy('created_at', 'desc');
	}

	// Find active loans for a borrower
	async findActiveLoansByBorrower(borrowerId: string): Promise<Loan[]> {
		return await db('loans')
			.where('user_id', borrowerId)
			.whereIn('status', [LoanStatus.ACTIVE, LoanStatus.DISBURSED])
			.orderBy('created_at', 'desc');
	}

	// Update loan status
	async updateStatus(id: string, status: LoanStatus, additionalData?: Partial<Loan>): Promise<Loan | null> {
		const updateData: any = {
			status,
			updated_at: new Date()
		};

		if (status === LoanStatus.APPROVED) {
			updateData.approved_at = new Date();
		} else if (status === LoanStatus.DISBURSED) {
			updateData.disbursed_at = new Date();
		}

		if (additionalData) {
			Object.assign(updateData, additionalData);
		}

		const [loan] = await db('loans')
			.where('id', id)
			.update(updateData)
			.returning('*');

		return loan || null;
	}

	// Get loan statistics
	async getLoanStats(): Promise<{
		total: number;
		pending: number;
		approved: number;
		active: number;
		completed: number;
		defaulted: number;
	}> {
		const stats = await db('loans')
			.select('status')
			.count('* as count')
			.groupBy('status');

		const result = {
			total: 0,
			pending: 0,
			approved: 0,
			active: 0,
			completed: 0,
			defaulted: 0
		};

		stats.forEach(stat => {
			result.total += Number(stat.count);
			result[String(stat.status).toLowerCase() as keyof typeof result] = Number(stat.count);
		});

		return result;
	}
}
