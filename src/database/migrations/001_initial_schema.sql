-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE loan_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'DISBURSED', 'ACTIVE', 'COMPLETED', 'DEFAULTED', 'CANCELLED');
CREATE TYPE repayment_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'OVERDUE');
CREATE TYPE payment_method AS ENUM ('BANK_TRANSFER', 'CARD', 'PAYSTACK', 'FLUTTERWAVE', 'CASH');
CREATE TYPE notification_type AS ENUM ('INFO', 'WARNING', 'SUCCESS', 'ERROR', 'REMINDER');

-- Users table (admin users only)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Borrowers table (people you lend to)
CREATE TABLE borrowers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    nin VARCHAR(20) UNIQUE,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    address TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loans table
CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    borrower_id UUID NOT NULL REFERENCES borrowers(id) ON DELETE CASCADE,

    -- Loan details
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0), -- Loan amount
    interest_rate DECIMAL(5, 2) NOT NULL CHECK (interest_rate >= 0), -- Interest rate
    term_in_months INTEGER NOT NULL CHECK (term_in_months > 0), -- Loan term
    repayment_frequency VARCHAR(20) DEFAULT 'MONTHLY', -- MONTHLY, WEEKLY, DAILY

    -- Financial tracking
    monthly_payment DECIMAL(15, 2) NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL, -- Total to be repaid
    outstanding_balance DECIMAL(15, 2) NOT NULL, -- Current amount owed
    total_interest_earned DECIMAL(15, 2) DEFAULT 0,
    total_principal_paid DECIMAL(15, 2) DEFAULT 0,
    days_overdue INTEGER DEFAULT 0, -- Days past due
    last_payment_date DATE, -- When they last made a payment
    next_payment_due_date DATE, -- When next payment is due
    months_overdue INTEGER DEFAULT 0, -- Months past due
    collection_status VARCHAR(20) DEFAULT 'NORMAL', -- NORMAL, CONTACTED, WARNING, LEGAL
    collection_notes TEXT, -- Notes about collection efforts

    -- Business fields
    purpose TEXT,
    loan_category VARCHAR(50) DEFAULT 'PERSONAL', -- PERSONAL, BUSINESS, EMERGENCY
    risk_level VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH
    collateral_value DECIMAL(15, 2) DEFAULT 0,
    guarantor_id UUID REFERENCES users(id),

    -- Status and dates
    status loan_status DEFAULT 'PENDING',
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    disbursed_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    next_payment_date DATE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Repayments table
CREATE TABLE repayments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    borrower_id UUID NOT NULL REFERENCES borrowers(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    principal_amount DECIMAL(15, 2) NOT NULL CHECK (principal_amount >= 0),
    interest_amount DECIMAL(15, 2) NOT NULL CHECK (interest_amount >= 0),
    status repayment_status DEFAULT 'PENDING',
    method payment_method DEFAULT 'BANK_TRANSFER',

    -- Payment gateway details
    transaction_reference VARCHAR(255) UNIQUE,
    gateway_response JSONB,

    -- Timestamps
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    borrower_id UUID NOT NULL REFERENCES borrowers(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type notification_type DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_borrowers_phone ON borrowers(phone);
CREATE INDEX idx_borrowers_nin ON borrowers(nin);
CREATE INDEX idx_borrowers_created_at ON borrowers(created_at);
CREATE INDEX idx_borrowers_created_by ON borrowers(created_by);

CREATE INDEX idx_loans_borrower_id ON loans(borrower_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_applied_at ON loans(applied_at);
CREATE INDEX idx_loans_due_date ON loans(due_date);
CREATE INDEX idx_loans_next_payment_date ON loans(next_payment_date);
CREATE INDEX idx_loans_risk_level ON loans(risk_level);
CREATE INDEX idx_loans_loan_category ON loans(loan_category);
CREATE INDEX idx_loans_guarantor_id ON loans(guarantor_id);
CREATE INDEX idx_loans_days_overdue ON loans(days_overdue);

CREATE INDEX idx_repayments_loan_id ON repayments(loan_id);
CREATE INDEX idx_repayments_borrower_id ON repayments(borrower_id);
CREATE INDEX idx_repayments_status ON repayments(status);
CREATE INDEX idx_repayments_due_date ON repayments(due_date);
CREATE INDEX idx_repayments_transaction_reference ON repayments(transaction_reference);

CREATE INDEX idx_notifications_borrower_id ON notifications(borrower_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_borrowers_updated_at BEFORE UPDATE ON borrowers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_repayments_updated_at BEFORE UPDATE ON repayments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update overdue loans
CREATE OR REPLACE FUNCTION update_overdue_loans()
RETURNS void AS $$
BEGIN
    -- Update loans that are overdue
    UPDATE loans
    SET
        days_overdue = EXTRACT(DAY FROM (CURRENT_DATE - next_payment_due_date)),
        months_overdue = EXTRACT(MONTH FROM (CURRENT_DATE - next_payment_due_date)),
        status = CASE
            WHEN EXTRACT(MONTH FROM (CURRENT_DATE - next_payment_due_date)) >= 3 THEN 'DEFAULTED'
            WHEN EXTRACT(DAY FROM (CURRENT_DATE - next_payment_due_date)) > 30 THEN 'DEFAULTED'
            WHEN EXTRACT(DAY FROM (CURRENT_DATE - next_payment_due_date)) > 0 THEN 'ACTIVE'
            ELSE status
        END,
        collection_status = CASE
            WHEN EXTRACT(MONTH FROM (CURRENT_DATE - next_payment_due_date)) >= 3 THEN 'LEGAL'
            WHEN EXTRACT(MONTH FROM (CURRENT_DATE - next_payment_due_date)) >= 2 THEN 'WARNING'
            WHEN EXTRACT(DAY FROM (CURRENT_DATE - next_payment_due_date)) > 7 THEN 'CONTACTED'
            ELSE 'NORMAL'
        END
    WHERE
        status IN ('ACTIVE', 'DISBURSED')
        AND next_payment_due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to create admin user
CREATE OR REPLACE FUNCTION create_admin_user(
    admin_email VARCHAR(255),
    admin_password VARCHAR(255),
    admin_first_name VARCHAR(100),
    admin_last_name VARCHAR(100)
)
RETURNS UUID AS $$
DECLARE
    admin_id UUID;
BEGIN
    -- Check if admin already exists
    SELECT id INTO admin_id FROM users WHERE email = admin_email;

    IF admin_id IS NOT NULL THEN
        RETURN admin_id;
    END IF;

    -- Create admin user
    INSERT INTO users (email, password, first_name, last_name, is_active)
    VALUES (admin_email, admin_password, admin_first_name, admin_last_name, true)
    RETURNING id INTO admin_id;

    RETURN admin_id;
END;
$$ LANGUAGE plpgsql;
