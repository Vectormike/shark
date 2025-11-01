#!/usr/bin/env node

require('dotenv').config();
const { rollbackSeed } = require('../build/database/seeds/index');

async function main() {
  const filename = process.argv[2];

  if (!filename) {
    console.error('❌ Please provide a seed filename to rollback');
    console.error('Usage: node scripts/seed-rollback.js <filename>');
    process.exit(1);
  }

  try {
    await rollbackSeed(filename);
    console.log('🎉 Rollback completed');
    process.exit(0);
  } catch (error) {
    console.error('💥 Rollback failed:', error);
    process.exit(1);
  }
}

main();
