#!/usr/bin/env node

require('dotenv').config();
const { runMigrations } = require('../build/utils/migrate');

async function main() {
  try {
    await runMigrations();
    console.log('🎉 Migration process completed');
    process.exit(0);
  } catch (error) {
    console.error('💥 Migration process failed:', error);
    process.exit(1);
  }
}

main();
