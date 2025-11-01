-- Seed data for admin user
-- This will be run after migrations to set up initial data

-- Insert admin user (password: Redeemer40@123)
INSERT INTO users (
  id,
  email,
  password,
  first_name,
  last_name,
  is_active,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'victorjonah199@gmail.com',
  '$2b$10$Ih99ILXehncWzwQ0NLH1JO4XzQbdgZ168Hpl8hxv/z7icCntYb3ES', -- password: Redeemer40@123
  'Admin',
  'User',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;
