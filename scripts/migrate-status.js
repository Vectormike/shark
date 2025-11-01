#!/usr/bin/env node

require('dotenv').config();
const { getMigrationStatus } = require('../build/utils/migrate');

async function main() {
  try {
    await getMigrationStatus();
    console.log('🎉 Status check completed');
    process.exit(0);
  } catch (error) {
    console.error('💥 Status check failed:', error);
    process.exit(1);
  }
}

main();
