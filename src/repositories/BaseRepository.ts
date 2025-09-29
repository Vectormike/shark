import { db } from '../config/database';

export abstract class BaseRepository<T> {
    protected tableName: string;

    constructor(tableName: string) {
        this.tableName = tableName;
    }

    // Create a new record
    async create(data: Partial<T>): Promise<T> {
        const [record] = await db(this.tableName)
            .insert(data)
            .returning('*');
        return record;
    }

    // Find by ID
    async findById(id: string): Promise<T | null> {
        const record = await db(this.tableName)
            .where('id', id)
            .first();
        return record || null;
    }

    // Find all with pagination
    async findAll(options: {
        page?: number;
        limit?: number;
        orderBy?: string;
        orderDirection?: 'asc' | 'desc';
    } = {}): Promise<{ data: T[]; total: number }> {
        const { page = 1, limit = 10, orderBy = 'created_at', orderDirection = 'desc' } = options;
        const offset = (page - 1) * limit;

        const [data, totalCount] = await Promise.all([
            db(this.tableName)
                .orderBy(orderBy, orderDirection)
                .limit(limit)
                .offset(offset),
            db(this.tableName).count('* as count').first()
        ]);

        return {
            data,
            total: Number(totalCount?.count || 0)
        };
    }

    // Update by ID
    async update(id: string, data: Partial<T>): Promise<T | null> {
        const [record] = await db(this.tableName)
            .where('id', id)
            .update({ ...data, updated_at: new Date() })
            .returning('*');
        return record || null;
    }

    // Delete by ID
    async delete(id: string): Promise<boolean> {
        const deleted = await db(this.tableName)
            .where('id', id)
            .del();
        return deleted > 0;
    }

    // Find with conditions
    async findWhere(conditions: Record<string, any>): Promise<T[]> {
        return await db(this.tableName).where(conditions);
    }

    // Find one with conditions
    async findOneWhere(conditions: Record<string, any>): Promise<T | null> {
        const record = await db(this.tableName)
            .where(conditions)
            .first();
        return record || null;
    }
}
