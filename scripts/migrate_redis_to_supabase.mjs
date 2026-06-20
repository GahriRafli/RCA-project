import { Redis } from '@upstash/redis';
import { createClient } from '@supabase/supabase-js';

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!UPSTASH_URL || !UPSTASH_TOKEN) {
  console.error('Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars');
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}

const redis = new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

console.log('Starting migration from Upstash Redis to Supabase...');

async function migrateReports() {
  console.log('Migrating reports...');
  try {
    const ids = await redis.zrange('rca:reports:list', 0, -1, { rev: true });
    if (!ids || ids.length === 0) {
      console.log('No report IDs found in rca:reports:list');
      return;
    }

    for (const id of ids) {
      const raw = await redis.get(`rca:report:${id}`);
      if (!raw) continue;
      let parsed;
      try {
        parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch (e) {
        console.warn('Failed to parse report', id, e);
        continue;
      }

      // Ensure fields match the SQL schema
      const row = {
        id: parsed.id || id,
        name: parsed.name || parsed.created_by_user_name || 'Unknown',
        nip: parsed.nip || null,
        judul: parsed.judul || null,
        ringkasan: parsed.ringkasan || parsed.summary || null,
        root_cause: parsed.root_cause || null,
        penyebab: parsed.penyebab ? JSON.stringify(parsed.penyebab) : JSON.stringify([]),
        tindakan: parsed.tindakan ? JSON.stringify(parsed.tindakan) : JSON.stringify([]),
        transcript: parsed.transcript || null,
        language: parsed.language || 'id',
        created_by_user_id: parsed.created_by_user_id || null,
        created_by_user_name: parsed.created_by_user_name || null,
        created_by_role: parsed.created_by_role || null,
        updated_by_user_id: parsed.updated_by_user_id || null,
        updated_by_user_name: parsed.updated_by_user_name || null,
        updated_by_role: parsed.updated_by_role || null,
        created_at: parsed.created_at || new Date().toISOString(),
        updated_at: parsed.updated_at || new Date().toISOString(),
      };

      const { error } = await supabase.from('reports').upsert(row);
      if (error) console.error('Insert report error', id, error);
      else console.log('Migrated report', id);
    }
  } catch (err) {
    console.error('Error migrating reports:', err);
  }
}

async function migrateLogins() {
  console.log('Migrating logins (if present)...');
  try {
    // Try zrange on sorted set first
    let members = [];
    try {
      members = await redis.zrange('rca:logins', 0, -1, { rev: true }) || [];
    } catch (e) {
      // fallback to list
      try {
        members = await redis.lrange('rca:logins', 0, 9999) || [];
      } catch (e2) {
        members = [];
      }
    }

    if (!members || members.length === 0) {
      console.log('No login events found in Redis');
      return;
    }

    for (const m of members) {
      let parsed;
      try {
        parsed = typeof m === 'string' ? JSON.parse(m) : m;
      } catch (e) {
        console.warn('Failed to parse login member', m);
        continue;
      }

      const row = {
        id: parsed.id || crypto.randomUUID(),
        user_id: parsed.user_id || null,
        name: parsed.name || null,
        nip: parsed.nip || null,
        ts: parsed.ts || new Date().toISOString(),
        ua: parsed.ua || null,
        ip: parsed.ip || null,
      };

      const { error } = await supabase.from('logins').upsert(row);
      if (error) console.error('Insert login error', error);
      else console.log('Migrated login', row.id);
    }
  } catch (err) {
    console.error('Error migrating logins:', err);
  }
}

async function run() {
  await migrateReports();
  await migrateLogins();
  console.log('Migration complete.');
  process.exit(0);
}

run();
