#!/usr/bin/env node

require('dotenv').config();
const { getSeedStatus } = require('../build/database/seeds/index');

async function main() {
  try {
    await getSeedStatus();
    console.log('🎉 Status check completed');
    process.exit(0);
  } catch (error) {
    console.error('💥 Status check failed:', error);
    process.exit(1);
  }
}

main();
