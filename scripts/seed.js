#!/usr/bin/env node

require('dotenv').config();
const { runSeeds } = require('../build/database/seeds/index');

async function main() {
  try {
    await runSeeds();
    console.log('🎉 Seeding process completed');
    process.exit(0);
  } catch (error) {
    console.error('💥 Seeding process failed:', error);
    process.exit(1);
  }
}

main();
