#!/usr/bin/env node

require('dotenv').config();
const { rollbackMigration } = require('../build/utils/migrate');

async function main() {
  const filename = process.argv[2];

  if (!filename) {
    console.error('❌ Please provide a migration filename to rollback');
    console.error('Usage: node scripts/migrate-rollback.js <filename>');
    process.exit(1);
  }

  try {
    await rollbackMigration(filename);
    console.log('🎉 Rollback completed');
    process.exit(0);
  } catch (error) {
    console.error('💥 Rollback failed:', error);
    process.exit(1);
  }
}

main();
