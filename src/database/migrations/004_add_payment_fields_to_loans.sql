-- Add payment gateway fields to loans table
ALTER TABLE loans
ADD COLUMN disbursement_reference VARCHAR(255),
ADD COLUMN disbursement_gateway_response JSONB,
ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;

-- Add index for disbursement reference
CREATE INDEX idx_loans_disbursement_reference ON loans(disbursement_reference);
