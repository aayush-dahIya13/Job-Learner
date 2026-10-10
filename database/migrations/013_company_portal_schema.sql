-- Migration 013: Company Portal Schema and Role Extension
-- Idempotent script for adding company role and company profiles table.

-- 1. Update users role check constraint to allow 'company'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('student', 'admin', 'company'));

-- 2. Create company_profiles table
CREATE TABLE IF NOT EXISTS company_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  industry VARCHAR(120) NOT NULL,
  company_size VARCHAR(50),
  website VARCHAR(255),
  contact_person VARCHAR(160) NOT NULL,
  contact_phone VARCHAR(30) NOT NULL,
  description TEXT,
  verification_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS company_profiles_user_id_idx ON company_profiles(user_id);
CREATE INDEX IF NOT EXISTS company_profiles_verification_status_idx ON company_profiles(verification_status);
