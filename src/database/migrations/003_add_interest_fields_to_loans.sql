-- Add interest calculation fields to loans table
ALTER TABLE loans
ADD COLUMN total_interest DECIMAL(15, 2) DEFAULT 0,
ADD COLUMN monthly_interest DECIMAL(15, 2) DEFAULT 0;

-- Update existing loans to calculate these fields
UPDATE loans
SET
    total_interest = (amount * interest_rate / 100),
    monthly_interest = (amount * interest_rate / 100) / term_in_months
WHERE total_interest = 0 OR total_interest IS NULL;
