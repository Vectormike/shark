import { BorrowerRepository } from '../repositories/BorrowerRepository';
import { Borrower } from '../types/database';
import { CacheService, CacheKeys } from '../config/redis';
import { db } from '../config/database';


export class BorrowerService {
	private borrowerRepository: BorrowerRepository;

	constructor() {
		this.borrowerRepository = new BorrowerRepository();
	}

	// Create a new borrower
	async createBorrower(data: {
		first_name: string;
		last_name: string;
		phone: string;
		nin?: string;
		address?: string;
		emergency_contact_name?: string;
		emergency_contact_phone?: string;
		notes?: string;
		created_by: string;
	}): Promise<Borrower> {
		// Validate required fields
		if (!data.first_name || !data.last_name || !data.phone) {
			throw new Error('First name, last name, and phone number are required');
		}

		// Check if phone number already exists
		const existingPhone = await this.borrowerRepository.phoneExists(data.phone);
		if (existingPhone) {
			throw new Error('A borrower with this phone number already exists');
		}

		// Check if NIN already exists (if provided)
		if (data.nin) {
			const existingNIN = await this.borrowerRepository.ninExists(data.nin);
			if (existingNIN) {
				throw new Error('A borrower with this NIN already exists');
			}
		}

		const borrower = await this.borrowerRepository.create({
			...data
		});

		await CacheService.delete(CacheKeys.ALL_BORROWERS);

		return borrower;
	}

	// Get all borrowers with pagination and search
	async getBorrowers(options: {
		page?: number;
		limit?: number;
		search?: string;
		includeInactive?: boolean;
	} = {}): Promise<{
		borrowers: Borrower[];
		pagination: {
			page: number;
			limit: number;
			total: number;
			pages: number;
		};
	}> {
		const { page = 1, limit = 20, search, includeInactive = false } = options;

		// Try cache first (only for active borrowers)
		const cacheKey = CacheKeys.ALL_BORROWERS + `_${page}_${limit}_${search || ''}_${includeInactive}`;
		const cachedBorrowers = await CacheService.get(cacheKey);

		if (cachedBorrowers) {
			return cachedBorrowers;
		}

		const result = await this.borrowerRepository.findBorrowers({
			page,
			limit,
			search,
			includeInactive
		});

		const response = {
			borrowers: result.data,
			pagination: {
				page,
				limit,
				total: result.total,
				pages: Math.ceil(result.total / limit)
			}
		};

		// Cache the result for 5 minutes
		await CacheService.set(cacheKey, response, 300);

		return response;
	}

	// Get borrower by ID
	async getBorrowerById(id: string): Promise<Borrower> {
		// Try cache first
		const cachedBorrower = await CacheService.get(CacheKeys.BORROWER_DETAILS(id));
		if (cachedBorrower) {
			return cachedBorrower;
		}

		const borrower = await this.borrowerRepository.findBorrowerById(id);
		if (!borrower) {
			throw new Error('Borrower not found');
		}

		// Cache for 5 minutes
		await CacheService.set(CacheKeys.BORROWER_DETAILS(id), borrower, 300);

		return borrower;
	}

	// Update borrower
	async updateBorrower(id: string, updates: Partial<Borrower>): Promise<Borrower> {
		// Check if borrower exists
		const existingBorrower = await this.borrowerRepository.findBorrowerById(id);
		if (!existingBorrower) {
			throw new Error('Borrower not found');
		}

		// Check for phone/NIN conflicts if updating those fields
		if (updates.phone && updates.phone !== existingBorrower.phone) {
			const phoneExists = await this.borrowerRepository.phoneExists(updates.phone, id);
			if (phoneExists) {
				throw new Error('Phone number already exists for another borrower');
			}
		}

		if (updates.nin && updates.nin !== existingBorrower.nin) {
			const ninExists = await this.borrowerRepository.ninExists(updates.nin, id);
			if (ninExists) {
				throw new Error('NIN already exists for another borrower');
			}
		}

		const updatedBorrower = await this.borrowerRepository.update(id, updates);
		if (!updatedBorrower) {
			throw new Error('Failed to update borrower');
		}

		// Clear cache
		await CacheService.delete(CacheKeys.BORROWER_DETAILS(id));
		await CacheService.delete(CacheKeys.ALL_BORROWERS);

		return updatedBorrower;
	}

	// Check if borrower has active loans
	private async checkActiveLoans(borrowerId: string): Promise<number> {
		const activeStatuses = ['PENDING', 'APPROVED', 'DISBURSED', 'ACTIVE'];

		const result = await db('loans')
			.where('borrower_id', borrowerId)
			.whereIn('status', activeStatuses)
			.count('* as count')
			.first();

		return Number(result?.count || 0);
	}

	async deactivateBorrower(id: string, reason?: string): Promise<void> {
		const borrower = await this.borrowerRepository.findBorrowerById(id);
		if (!borrower) {
			throw new Error('Borrower not found');
		}

		if (!borrower.is_active) {
			throw new Error('Borrower is already deactivated');
		}

		const activeLoanCount = await this.checkActiveLoans(id);
		if (activeLoanCount > 0) {
			throw new Error(`Cannot deactivate borrower with ${activeLoanCount} active loan(s). Please close all active loans first.`);
		}

		await this.borrowerRepository.update(id, {
			is_active: false,
			deactivated_at: new Date(),
			deactivation_reason: reason
		});

		await CacheService.delete(CacheKeys.BORROWER_DETAILS(id));
		await CacheService.delete(CacheKeys.ALL_BORROWERS);
	}

	// Reactivate borrower
	async reactivateBorrower(id: string): Promise<Borrower> {
		const borrower = await this.borrowerRepository.findBorrowerById(id);
		if (!borrower) {
			throw new Error('Borrower not found');
		}

		if (borrower.is_active) {
			throw new Error('Borrower is already active');
		}

		const updatedBorrower = await this.borrowerRepository.update(id, {
			is_active: true,
			deactivated_at: undefined,
			deactivation_reason: undefined
		});

		if (!updatedBorrower) {
			throw new Error('Failed to reactivate borrower');
		}

		// Clear cache
		await CacheService.delete(CacheKeys.BORROWER_DETAILS(id));
		await CacheService.delete(CacheKeys.ALL_BORROWERS);

		return updatedBorrower;
	}

	// Search borrowers
	async searchBorrowers(searchTerm: string): Promise<Borrower[]> {
		return await this.borrowerRepository.findBorrowers({ search: searchTerm, limit: 50 }).then(result => result.data);
	}
}
