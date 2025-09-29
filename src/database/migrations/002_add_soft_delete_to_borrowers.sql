-- Add soft delete fields to borrowers table
ALTER TABLE borrowers
ADD COLUMN is_active BOOLEAN DEFAULT true,
ADD COLUMN deactivated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN deactivation_reason TEXT;

-- Update existing borrowers to be active
UPDATE borrowers SET is_active = true WHERE is_active IS NULL;

-- Add index for better performance on active borrowers
CREATE INDEX idx_borrowers_is_active ON borrowers(is_active);

-- Add index for deactivated borrowers
CREATE INDEX idx_borrowers_deactivated_at ON borrowers(deactivated_at) WHERE is_active = false;
