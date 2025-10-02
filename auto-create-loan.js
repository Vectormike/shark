#!/usr/bin/env node

/**
 * Auto Create Loan Script
 * Creates a loan for any disbursement reference from command line
 *
 * Usage: node auto-create-loan.js DISB_1234567890_ABCDEF
 */

const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const DISBURSEMENT_REF = process.argv[2];

if (!DISBURSEMENT_REF) {
    console.error('❌ Please provide a disbursement reference');
    console.log('Usage: node auto-create-loan.js DISB_1234567890_ABCDEF');
    process.exit(1);
}

async function createLoanForReference() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || 'postgresql://victorjonah@localhost:5432/loan_shark_db'
    });

    try {
        await client.connect();
        console.log('🔗 Connected to database');
        console.log(`🎯 Creating loan for disbursement reference: ${DISBURSEMENT_REF}`);

        // Check if loan already exists
        const existingLoan = await client.query(`
      SELECT id, status FROM loans WHERE disbursement_reference = $1
    `, [DISBURSEMENT_REF]);

        if (existingLoan.rows.length > 0) {
            console.log('✅ Loan already exists!');
            console.log(`   Loan ID: ${existingLoan.rows[0].id}`);
            console.log(`   Status: ${existingLoan.rows[0].status}`);
            return;
        }

        // Generate UUIDs
        const borrowerId = uuidv4();
        const loanId = uuidv4();

        // Use existing user
        const userId = '1893a503-ef9b-4e25-9d59-0eaf012e1c0d'; // admin@loanshark.local

        // Create borrower
        console.log('👤 Creating borrower...');
        await client.query(`
      INSERT INTO borrowers (id, first_name, last_name, phone, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (phone) DO UPDATE SET updated_at = NOW()
      RETURNING id
    `, [
            borrowerId,
            'Auto',
            'Borrower',
            `+23480${Math.random().toString().slice(2, 10)}`,
            userId
        ]);

        // Create loan
        console.log('💰 Creating loan...');
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
            `Auto-created loan for ${DISBURSEMENT_REF}`,
            'APPROVED',
            DISBURSEMENT_REF,
            new Date(Date.now() - 86400000), // Applied 1 day ago
            new Date(Date.now() - 3600000),  // Approved 1 hour ago
            new Date(Date.now() + (6 * 30 * 86400000)), // Due in 6 months
            new Date(Date.now() + (30 * 86400000)) // Next payment in 1 month
        ]);

        console.log('✅ Loan created successfully!');
        console.log(`   Loan ID: ${loanId}`);
        console.log(`   Status: ${loanResult.rows[0].status}`);
        console.log(`   Disbursement Reference: ${DISBURSEMENT_REF}`);
        console.log('');
        console.log('🎯 The webhook should now work for this disbursement reference!');

    } catch (error) {
        console.error('❌ Error creating loan:', error.message);
    } finally {
        await client.end();
    }
}

createLoanForReference();
