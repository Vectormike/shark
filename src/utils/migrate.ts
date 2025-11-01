import dotenv from 'dotenv';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { pool } from '../config/database';

// Load environment variables
dotenv.config();

interface MigrationRecord {
	id: number;
	filename: string;
	executed_at: Date;
}

export async function runMigrations(): Promise<void> {
	try {
		console.log('🔄 Starting database migration...');

		// Create migrations tracking table if it doesn't exist
		await createMigrationsTable();

		// Get list of migration files
		const migrationsDir = join(__dirname, '../../src/database/migrations');
		const migrationFiles = readdirSync(migrationsDir)
			.filter(file => file.endsWith('.sql'))
			.sort(); // Sort to ensure proper order

		console.log(`📁 Found ${migrationFiles.length} migration files`);

		// Get already executed migrations
		const executedMigrations = await getExecutedMigrations();

		let executedCount = 0;

		for (const filename of migrationFiles) {
			// Check if this migration has already been executed
			if (executedMigrations.some(m => m.filename === filename)) {
				console.log(`⏭️  Skipping ${filename} (already executed)`);
				continue;
			}

			console.log(`🔄 Executing migration: ${filename}`);

			// Read and execute the migration
			const migrationPath = join(migrationsDir, filename);
			const migrationSQL = readFileSync(migrationPath, 'utf8');

			await pool.query(migrationSQL);

			// Record the migration as executed
			await recordMigration(filename);

			executedCount++;
			console.log(`✅ Completed migration: ${filename}`);
		}

		if (executedCount === 0) {
			console.log('✅ All migrations are already up to date!');
		} else {
			console.log(`🎉 Successfully executed ${executedCount} migration(s)!`);
		}

	} catch (error) {
		console.error('❌ Migration failed:', error);
		throw error;
	}
}

async function createMigrationsTable(): Promise<void> {
	const createTableSQL = `
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

	await pool.query(createTableSQL);
}

async function getExecutedMigrations(): Promise<MigrationRecord[]> {
	try {
		const result = await pool.query('SELECT * FROM migrations ORDER BY id');
		return result.rows;
	} catch (error) {
		// If table doesn't exist yet, return empty array
		return [];
	}
}

async function recordMigration(filename: string): Promise<void> {
	await pool.query(
		'INSERT INTO migrations (filename) VALUES ($1)',
		[filename]
	);
}

export async function rollbackMigration(filename: string): Promise<void> {
	try {
		console.log(`🔄 Rolling back migration: ${filename}`);

		// Check if migration was executed
		const executedMigrations = await getExecutedMigrations();
		const migration = executedMigrations.find(m => m.filename === filename);

		if (!migration) {
			throw new Error(`Migration ${filename} has not been executed or does not exist.`);
		}

		// Look for rollback SQL file
		const migrationsDir = join(__dirname, '../../src/database/migrations');
		const rollbackFilename = filename.replace('.sql', '.rollback.sql');
		const rollbackPath = join(migrationsDir, rollbackFilename);

		try {
			// Read and execute rollback SQL if it exists
			const rollbackSQL = readFileSync(rollbackPath, 'utf8');
			console.log(`📄 Found rollback file: ${rollbackFilename}`);
			await pool.query(rollbackSQL);
			console.log(`✅ Executed rollback SQL for: ${filename}`);
		} catch (fileError: any) {
			if (fileError.code === 'ENOENT') {
				console.warn(`⚠️  No rollback file found for ${filename}. Only removing from migrations table.`);
				console.warn(`⚠️  Expected file: ${rollbackFilename}`);
			} else {
				throw fileError;
			}
		}

		// Remove from migrations table
		await pool.query('DELETE FROM migrations WHERE filename = $1', [filename]);

		console.log(`✅ Rolled back migration: ${filename}`);
	} catch (error) {
		console.error('❌ Rollback failed:', error);
		throw error;
	}
}

export async function getMigrationStatus(): Promise<void> {
	try {
		const executedMigrations = await getExecutedMigrations();

		console.log('📊 Migration Status:');
		console.log('==================');

		if (executedMigrations.length === 0) {
			console.log('No migrations have been executed yet.');
		} else {
			executedMigrations.forEach(migration => {
				console.log(`✅ ${migration.filename} - ${migration.executed_at}`);
			});
		}
	} catch (error) {
		console.error('❌ Failed to get migration status:', error);
		throw error;
	}
}

// Run migration if this file is executed directly
if (require.main === module) {
	const command = process.argv[2];

	if (command === 'rollback' && process.argv[3]) {
		rollbackMigration(process.argv[3])
			.then(() => {
				console.log('🎉 Rollback completed');
				process.exit(0);
			})
			.catch((error) => {
				console.error('💥 Rollback failed:', error);
				process.exit(1);
			});
	} else if (command === 'status') {
		getMigrationStatus()
			.then(() => {
				console.log('🎉 Status check completed');
				process.exit(0);
			})
			.catch((error) => {
				console.error('💥 Status check failed:', error);
				process.exit(1);
			});
	} else {
		runMigrations()
			.then(() => {
				console.log('🎉 Migration process completed');
				process.exit(0);
			})
			.catch((error) => {
				console.error('💥 Migration process failed:', error);
				process.exit(1);
			});
	}
}
