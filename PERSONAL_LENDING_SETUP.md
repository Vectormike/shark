# Personal Lending Setup Guide

This guide will help you set up the Loan Shark App for personal lending to individuals.

## Overview

The application has been modified for personal lending where:
- **You** are the admin with full access
- **Borrowers** are individuals you lend to (no app access for now)
- **Essential borrower info**: Name, phone, NIN (optional), emergency contact

## Quick Start

### 1. Database Setup

Run the new migration to add borrower-specific fields:

```bash
# Apply the new migration
psql -d loan_shark_db -f src/database/migrations/002_personal_lending_schema.sql
```

### 2. Create Admin User

```bash
# Create your admin account
npx ts-node src/utils/setupAdmin.ts
```

**Default Admin Credentials:**
- Email: `admin@loanshark.local`
- Password: `admin123`

⚠️ **Change the password immediately after first login!**

### 3. Start the Application

```bash
pnpm dev
```

## API Endpoints for Personal Lending

### Authentication
- `POST /api/auth/login` - Login as admin
- `POST /api/auth/refresh` - Refresh token

### Borrower Management (Admin Only)
- `POST /api/borrowers` - Create new borrower
- `GET /api/borrowers` - List all borrowers (with search)
- `GET /api/borrowers/:id` - Get borrower details
- `PUT /api/borrowers/:id` - Update borrower info
- `PATCH /api/borrowers/:id/deactivate` - Deactivate borrower

### Loan Management (Admin Only)
- `POST /api/loans` - Create loan for borrower
- `GET /api/loans` - List all loans (with filters)
- `GET /api/loans/:id` - Get loan details
- `PUT /api/loans/:id` - Update loan
- `DELETE /api/loans/:id` - Delete loan
- `POST /api/loans/:id/repayment` - Process repayment

## Creating Your First Borrower

```bash
curl -X POST http://localhost:3000/api/borrowers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+2348012345678",
    "nin": "12345678901",
    "address": "123 Main Street, Lagos",
    "emergency_contact_name": "Jane Doe",
    "emergency_contact_phone": "+2348012345679",
    "notes": "Reliable borrower, first time"
  }'
```

## Creating a Loan

```bash
curl -X POST http://localhost:3000/api/loans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "borrower_id": "BORROWER_UUID",
    "amount": 50000,
    "interest_rate": 15.0,
    "term_in_months": 6,
    "purpose": "Business expansion"
  }'
```

## Essential Borrower Information

### Required Fields:
- **First Name** - Borrower's first name
- **Last Name** - Borrower's last name
- **Phone** - Primary contact number

### Optional but Recommended:
- **NIN** - National Identification Number for identity verification
- **Address** - Physical address
- **Emergency Contact Name** - Someone who knows the borrower
- **Emergency Contact Phone** - Emergency contact's phone
- **Notes** - Any additional information about the borrower

## Loan Workflow

1. **Create Borrower** - Add borrower information
2. **Create Loan** - Set loan amount, interest rate, term
3. **Approve Loan** - Update status to APPROVED
4. **Disburse Loan** - Update status to DISBURSED (when money is given)
5. **Track Repayments** - Process payments as they come in
6. **Complete Loan** - Mark as COMPLETED when fully paid

## Loan Statuses

- **PENDING** - Loan created, awaiting approval
- **APPROVED** - Loan approved, ready for disbursement
- **DISBURSED** - Money given to borrower
- **ACTIVE** - Loan is active, repayments ongoing
- **COMPLETED** - Loan fully repaid
- **DEFAULTED** - Borrower failed to repay
- **CANCELLED** - Loan cancelled before disbursement

## Security Notes

1. **Change default admin password** immediately
2. **Use strong passwords** for your admin account
3. **Keep your JWT tokens secure**
4. **Regular backups** of your database
5. **Monitor loan activities** regularly

## Future Enhancements

When you're ready to give borrowers access:
1. Add borrower authentication endpoints
2. Create borrower-facing dashboard
3. Add SMS notifications for loan updates
4. Implement borrower self-service features

## Support

For issues or questions:
1. Check the logs in your terminal
2. Verify database connections
3. Ensure Redis is running
4. Check API endpoint responses

Happy lending! 🚀

