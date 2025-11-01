import dotenv from 'dotenv';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { pool } from '../../config/database';

// Load environment variables
dotenv.config();

interface SeedRecord {
  id: number;
  filename: string;
  executed_at: Date;
}

export async function runSeeds(): Promise<void> {
  try {
    console.log('🌱 Starting database seeding...');

    // Create seeds tracking table if it doesn't exist
    await createSeedsTable();

    // Get list of seed files
    const seedsDir = join(__dirname, '../../../src/database/seeds');
    const seedFiles = readdirSync(seedsDir)
      .filter(file => file.endsWith('.sql') && file !== 'index.ts')
      .sort(); // Sort to ensure proper order

    console.log(`📁 Found ${seedFiles.length} seed files`);

    // Get already executed seeds
    const executedSeeds = await getExecutedSeeds();

    let executedCount = 0;

    for (const filename of seedFiles) {
      // Check if this seed has already been executed
      if (executedSeeds.some(s => s.filename === filename)) {
        console.log(`⏭️  Skipping ${filename} (already executed)`);
        continue;
      }

      console.log(`🌱 Executing seed: ${filename}`);

      // Read and execute the seed
      const seedPath = join(seedsDir, filename);
      const seedSQL = readFileSync(seedPath, 'utf8');

      await pool.query(seedSQL);

      // Record the seed as executed
      await recordSeed(filename);

      executedCount++;
      console.log(`✅ Completed seed: ${filename}`);
    }

    if (executedCount === 0) {
      console.log('✅ All seeds are already up to date!');
    } else {
      console.log(`🎉 Successfully executed ${executedCount} seed(s)!`);
    }

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

async function createSeedsTable(): Promise<void> {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS seeds (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  await pool.query(createTableSQL);
}

async function getExecutedSeeds(): Promise<SeedRecord[]> {
  try {
    const result = await pool.query('SELECT * FROM seeds ORDER BY id');
    return result.rows;
  } catch (error) {
    // If table doesn't exist yet, return empty array
    return [];
  }
}

async function recordSeed(filename: string): Promise<void> {
  await pool.query(
    'INSERT INTO seeds (filename) VALUES ($1)',
    [filename]
  );
}

export async function rollbackSeed(filename: string): Promise<void> {
  try {
    console.log(`🔄 Rolling back seed: ${filename}`);

    // Remove from seeds table
    await pool.query('DELETE FROM seeds WHERE filename = $1', [filename]);

    console.log(`✅ Rolled back seed: ${filename}`);
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}

export async function getSeedStatus(): Promise<void> {
  try {
    const executedSeeds = await getExecutedSeeds();

    console.log('📊 Seed Status:');
    console.log('==================');

    if (executedSeeds.length === 0) {
      console.log('No seeds have been executed yet.');
    } else {
      executedSeeds.forEach(seed => {
        console.log(`✅ ${seed.filename} - ${seed.executed_at}`);
      });
    }
  } catch (error) {
    console.error('❌ Failed to get seed status:', error);
    throw error;
  }
}

// Run seeds if this file is executed directly
if (require.main === module) {
  const command = process.argv[2];

  if (command === 'rollback' && process.argv[3]) {
    rollbackSeed(process.argv[3])
      .then(() => {
        console.log('🎉 Rollback completed');
        process.exit(0);
      })
      .catch((error) => {
        console.error('💥 Rollback failed:', error);
        process.exit(1);
      });
  } else if (command === 'status') {
    getSeedStatus()
      .then(() => {
        console.log('🎉 Status check completed');
        process.exit(0);
      })
      .catch((error) => {
        console.error('💥 Status check failed:', error);
        process.exit(1);
      });
  } else {
    runSeeds()
      .then(() => {
        console.log('🎉 Seeding process completed');
        process.exit(0);
      })
      .catch((error) => {
        console.error('💥 Seeding process failed:', error);
        process.exit(1);
      });
  }
}
