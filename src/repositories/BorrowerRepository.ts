import { BaseRepository } from './BaseRepository';
import { Borrower } from '../types/database';
import { db } from '../config/database';

export class BorrowerRepository extends BaseRepository<Borrower> {
    constructor() {
        super('borrowers');
    }

    // Find borrower by phone
    async findByPhone(phone: string): Promise<Borrower | null> {
        const borrower = await db('borrowers')
            .where('phone', phone)
            .first();
        return borrower || null;
    }

    // Find borrower by NIN
    async findByNIN(nin: string): Promise<Borrower | null> {
        const borrower = await db('borrowers')
            .where('nin', nin)
            .first();
        return borrower || null;
    }

    // Find all borrowers
    async findBorrowers(options: {
        page?: number;
        limit?: number;
        search?: string;
    } = {}): Promise<{ data: Borrower[]; total: number }> {
        const { page = 1, limit = 20, search } = options;
        const offset = (page - 1) * limit;

        let query = db('borrowers')
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
            db('borrowers').count('* as count').first()
        ]);

        return {
            data,
            total: Number(totalCount?.count || 0)
        };
    }

    // Find borrower by ID
    async findBorrowerById(id: string): Promise<Borrower | null> {
        const borrower = await db('borrowers')
            .where('id', id)
            .first();
        return borrower || null;
    }

    // Check if phone exists (excluding current borrower)
    async phoneExists(phone: string, excludeId?: string): Promise<boolean> {
        let query = db('borrowers').where('phone', phone);

        if (excludeId) {
            query = query.where('id', '!=', excludeId);
        }

        const borrower = await query.first();
        return !!borrower;
    }

    // Check if NIN exists (excluding current borrower)
    async ninExists(nin: string, excludeId?: string): Promise<boolean> {
        let query = db('borrowers').where('nin', nin);

        if (excludeId) {
            query = query.where('id', '!=', excludeId);
        }

        const borrower = await query.first();
        return !!borrower;
    }
}
