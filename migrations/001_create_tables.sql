-- Migration: create basic tables for RCA app

-- users table (simple demo users)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nip TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- reports table
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nip TEXT NOT NULL,
  judul TEXT,
  ringkasan TEXT,
  root_cause TEXT,
  penyebab JSONB DEFAULT '[]'::jsonb,
  tindakan JSONB DEFAULT '[]'::jsonb,
  transcript TEXT,
  language TEXT DEFAULT 'id',
  created_by_user_id TEXT,
  created_by_user_name TEXT,
  updated_by_user_id TEXT,
  updated_by_user_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- index for reports by created_at for fast ordering
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports (created_at DESC);

-- logins table was removed; user events should be stored elsewhere if needed.
