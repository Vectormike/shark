import { BaseRepository } from './BaseRepository';
import { User, UserRole } from '../types/database';
import { db } from '../config/database';

export class UserRepository extends BaseRepository<User> {
	constructor() {
		super('users');
	}

	// Find user by email
	async findByEmail(email: string): Promise<User | null> {
		const user = await db('users')
			.where('email', email)
			.first();
		return user || null;
	}

	// Find user by phone
	async findByPhone(phone: string): Promise<User | null> {
		const user = await db('users')
			.where('phone', phone)
			.first();
		return user || null;
	}

	// Find user by NIN
	async findByNIN(nin: string): Promise<User | null> {
		const user = await db('users')
			.where('nin', nin)
			.first();
		return user || null;
	}

	// Find all borrowers
	async findBorrowers(options: {
		page?: number;
		limit?: number;
		search?: string;
	} = {}): Promise<{ data: User[]; total: number }> {
		const { page = 1, limit = 20, search } = options;
		const offset = (page - 1) * limit;

		let query = db('users')
			.where('role', UserRole.BORROWER)
			.orderBy('created_at', 'desc');

		// Add search functionality
		if (search) {
			query = query.where(function () {
				this.where('first_name', 'ilike', `%${search}%`)
					.orWhere('last_name', 'ilike', `%${search}%`)
					.orWhere('phone', 'ilike', `%${search}%`)
					.orWhere('nin', 'ilike', `%${search}%`);
			});
		}

		const [data, totalCount] = await Promise.all([
			query.limit(limit).offset(offset),
			db('users').where('role', UserRole.BORROWER).count('* as count').first()
		]);

		return {
			data,
			total: Number(totalCount?.count || 0)
		};
	}

	// Find borrower by ID
	async findBorrowerById(id: string): Promise<User | null> {
		const user = await db('users')
			.where('id', id)
			.andWhere('role', UserRole.BORROWER)
			.first();
		return user || null;
	}

	// Check if email exists (excluding current user)
	async emailExists(email: string, excludeId?: string): Promise<boolean> {
		let query = db('users').where('email', email);

		if (excludeId) {
			query = query.where('id', '!=', excludeId);
		}

		const user = await query.first();
		return !!user;
	}

	// Check if phone exists (excluding current user)
	async phoneExists(phone: string, excludeId?: string): Promise<boolean> {
		let query = db('users').where('phone', phone);

		if (excludeId) {
			query = query.where('id', '!=', excludeId);
		}

		const user = await query.first();
		return !!user;
	}

	// Check if NIN exists (excluding current user)
	async ninExists(nin: string, excludeId?: string): Promise<boolean> {
		let query = db('users').where('nin', nin);

		if (excludeId) {
			query = query.where('id', '!=', excludeId);
		}

		const user = await query.first();
		return !!user;
	}
}
