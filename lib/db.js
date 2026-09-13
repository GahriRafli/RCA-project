import mysql from 'mysql2/promise';
import { createClient } from '@supabase/supabase-js';

// Gunakan MySQL jika DB_HOST dikonfigurasi (local dev),
// fallback ke Supabase jika tidak (production/Vercel)
const useMySQL = Boolean(process.env.DB_HOST);

// ── MySQL (local dev) ──────────────────────────────────────
let mysqlPool = null;
if (useMySQL) {
  mysqlPool = mysql.createPool({
    host:     process.env.DB_HOST,
    port:     Number(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'rca_db',
    waitForConnections: true,
    connectionLimit: 10,
    timezone: '+00:00',
  });
}

// ── Supabase (production) ──────────────────────────────────
let supabaseClient = null;
if (!useMySQL) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Database tidak dikonfigurasi. Set DB_HOST (MySQL) atau SUPABASE_URL (Supabase).');
  }
  supabaseClient = createClient(url, key, { auth: { persistSession: false } });
}

export { useMySQL, supabaseClient as supabase };
export default mysqlPool;
