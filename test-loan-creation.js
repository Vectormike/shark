#!/usr/bin/env node

/**
 * Test Loan Creation with WhatsApp Notifications
 * Creates a test loan and triggers WhatsApp notifications
 */

const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

async function testLoanCreation() {
	const client = new Client({
		connectionString: process.env.DATABASE_URL || 'postgresql://victorjonah@localhost:5432/loan_shark_db'
	});

	try {
		await client.connect();
		console.log('🔗 Connected to database');

		// Generate test data
		const borrowerId = uuidv4();
		const loanId = uuidv4();
		const userId = '1893a503-ef9b-4e25-9d59-0eaf012e1c0d'; // Existing user

		// Create test borrower
		console.log('👤 Creating test borrower...');
		await client.query(`
      INSERT INTO borrowers (id, first_name, last_name, phone, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (phone) DO UPDATE SET updated_at = NOW()
    `, [
			borrowerId,
			'Test',
			'Borrower',
			`+23480${Math.random().toString().slice(2, 10)}`,
			userId
		]);

		console.log('✅ Test borrower created');

		// Import and test loan service
		console.log('📦 Importing LoanService...');
		const { LoanService } = require('./build/services/LoanService');
		const loanService = new LoanService();

		// Create test loan
		console.log('💰 Creating test loan...');
		const loanData = {
			borrower_id: borrowerId,
			amount: 25000,
			interest_rate: 12,
			term_in_months: 6,
			purpose: 'Test loan for WhatsApp notification'
		};

		const loan = await loanService.createLoan(loanData);

		console.log('✅ Test loan created successfully!');
		console.log(`   Loan ID: ${loan.id}`);
		console.log(`   Amount: ₦${loan.amount.toLocaleString()}`);
		console.log(`   Status: ${loan.status}`);
		console.log('');
		console.log('💬 WhatsApp notifications should have been sent!');
		console.log('   - Check your admin phone for admin notification');
		console.log('   - Check borrower phone for borrower notification (if on WhatsApp)');

	} catch (error) {
		console.error('❌ Error testing loan creation:', error.message);
		console.error('Stack:', error.stack);
	} finally {
		await client.end();
	}
}

// Build the project first, then test
const { execSync } = require('child_process');

try {
	console.log('🔨 Building project...');
	execSync('pnpm build', { stdio: 'inherit' });
	console.log('✅ Build completed');
	console.log('');

	testLoanCreation();
} catch (error) {
	console.error('❌ Build failed:', error.message);
}
