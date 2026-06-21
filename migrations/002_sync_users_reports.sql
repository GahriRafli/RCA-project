-- Migration 002: Sync users and reports schema
-- Backup existing tables (creates copies with timestamp suffix)
-- IMPORTANT: Run within a safe migration environment and backup DB before applying.

BEGIN;

-- 1) Backup current tables
CREATE TABLE IF NOT EXISTS users_backup_before_002 AS TABLE users;
CREATE TABLE IF NOT EXISTS reports_backup_before_002 AS TABLE reports;
CREATE TABLE IF NOT EXISTS logins_backup_before_002 AS TABLE logins;

-- 2) Remove deprecated columns from `users`
ALTER TABLE IF EXISTS users
  DROP COLUMN IF EXISTS password_hash,
  DROP COLUMN IF EXISTS role;

-- Ensure users have created_at timestamp
ALTER TABLE IF EXISTS users
  ALTER COLUMN created_at SET DEFAULT now();

-- 3) Remove role columns from `reports`
ALTER TABLE IF EXISTS reports
  DROP COLUMN IF EXISTS created_by_role,
  DROP COLUMN IF EXISTS updated_by_role;

-- 4) Ensure created_by_user_name / updated_by_user_name columns exist
ALTER TABLE IF EXISTS reports
  ADD COLUMN IF NOT EXISTS created_by_user_name TEXT,
  ADD COLUMN IF NOT EXISTS updated_by_user_name TEXT;

-- 5) Drop logins table if exists (moved to backups)
DROP TABLE IF EXISTS logins;

-- 6) Optional indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_nip ON users (nip);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports (created_at DESC);

COMMIT;

-- NOTE: This script creates backups before altering/dropping.
-- Review backups and test after running. If you prefer automated rollback, run in a transaction manager.
