-- ============================================================
-- App RCA — MySQL Schema (Local Dev)
-- Jalankan sekali saat setup database lokal:
--   mysql -u root -p rca_db < migrations/mysql_schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS rca_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE rca_db;

CREATE TABLE IF NOT EXISTS reports (
  id                    VARCHAR(36)  NOT NULL PRIMARY KEY,
  name                  VARCHAR(255) NOT NULL,
  nip                   VARCHAR(50)  NOT NULL,
  judul                 TEXT,
  ringkasan             TEXT,
  root_cause            TEXT,
  penyebab              JSON,
  tindakan              JSON,
  transcript            TEXT,
  original_transcript   TEXT,
  language              VARCHAR(10)  DEFAULT 'id',
  created_by_user_id    VARCHAR(36),
  created_by_user_name  VARCHAR(255),
  updated_by_user_id    VARCHAR(36),
  updated_by_user_name  VARCHAR(255),
  created_at            DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
