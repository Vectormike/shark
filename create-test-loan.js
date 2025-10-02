#!/usr/bin/env node

/**
 * Create Test Loan Script
 * Creates a test loan with the disbursement reference from your webhook
 */

const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const DISBURSEMENT_REF = 'DISB_1759445099339_BU6LXP'; // From your webhook log

async function createTestLoan() {
	const client = new Client({
		connectionString: process.env.DATABASE_URL || 'postgresql://victorjonah@localhost:5432/loan_shark_db'
	});

	try {
		await client.connect();
		console.log('🔗 Connected to database');

		// Generate proper UUIDs
		const borrowerId = uuidv4();
		const loanId = uuidv4();

		// Use existing user
		const userId = '1893a503-ef9b-4e25-9d59-0eaf012e1c0d'; // admin@loanshark.local

		// Create a test borrower
		console.log('👤 Creating test borrower...');
		const borrowerResult = await client.query(`
      INSERT INTO borrowers (id, first_name, last_name, phone, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (phone) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        created_by = EXCLUDED.created_by,
        updated_at = NOW()
      RETURNING id
    `, [
			borrowerId,
			'John',
			'Doe',
			`+234801234567${Date.now().toString().slice(-1)}`, // Unique phone number
			userId
		]);

		console.log(`✅ Borrower ID: ${borrowerId}`);

		// Create a test loan with the disbursement reference
		console.log('💰 Creating test loan...');
		const loanResult = await client.query(`
      INSERT INTO loans (
        id, borrower_id, amount, interest_rate, term_in_months,
        monthly_payment, total_amount, total_interest, monthly_interest, outstanding_balance,
        purpose, status, disbursement_reference,
        applied_at, approved_at, due_date, next_payment_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING id, status
    `, [
			loanId,
			borrowerId,
			50000, // 50,000 NGN
			15,    // 15% interest rate
			6,     // 6 months term
			9500,  // Monthly payment
			57000, // Total amount (50k + 7k interest)
			7000,  // Total interest
			1167,  // Monthly interest
			50000, // Outstanding balance
			'Test loan for webhook testing',
			'APPROVED',
			DISBURSEMENT_REF,
			new Date(Date.now() - 86400000), // Applied 1 day ago
			new Date(Date.now() - 3600000),  // Approved 1 hour ago
			new Date(Date.now() + (6 * 30 * 86400000)), // Due in 6 months
			new Date(Date.now() + (30 * 86400000)) // Next payment in 1 month
		]);

		console.log(`✅ Loan created successfully!`);
		console.log(`   Loan ID: ${loanId}`);
		console.log(`   Status: ${loanResult.rows[0].status}`);
		console.log(`   Disbursement Reference: ${DISBURSEMENT_REF}`);
		console.log(`   Amount: ₦50,000`);
		console.log(`   Term: 6 months`);

		// Show the loan details
		const loanDetails = await client.query(`
      SELECT l.*, b.first_name, b.last_name, b.phone
      FROM loans l
      JOIN borrowers b ON l.borrower_id = b.id
      WHERE l.id = $1
    `, [loanId]);

		console.log('\n📋 Loan Details:');
		console.log('================');
		const loan = loanDetails.rows[0];
		console.log(`Borrower: ${loan.first_name} ${loan.last_name} (${loan.phone})`);
		console.log(`Amount: ₦${loan.amount.toLocaleString()}`);
		console.log(`Interest Rate: ${loan.interest_rate}%`);
		console.log(`Term: ${loan.term_in_months} months`);
		console.log(`Monthly Payment: ₦${loan.monthly_payment.toLocaleString()}`);
		console.log(`Total Amount: ₦${loan.total_amount.toLocaleString()}`);
		console.log(`Status: ${loan.status}`);
		console.log(`Disbursement Reference: ${loan.disbursement_reference}`);

		console.log('\n🎯 Now test your webhook again!');
		console.log('The webhook should now find this loan and update its status to DISBURSED.');

	} catch (error) {
		console.error('❌ Error creating test loan:', error.message);
		console.error('Stack:', error.stack);
	} finally {
		await client.end();
	}
}

createTestLoan();
