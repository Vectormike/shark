-- Add 2FA columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_backup_codes TEXT[]; -- Array of backup codes
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_verified_at TIMESTAMP WITH TIME ZONE;

-- Add index for 2FA queries
CREATE INDEX IF NOT EXISTS idx_users_two_factor_enabled ON users(two_factor_enabled);
