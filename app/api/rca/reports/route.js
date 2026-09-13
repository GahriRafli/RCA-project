import pool, { useMySQL, supabase } from '@/lib/db';
import { sendTelegramNotification } from '@/lib/telegram';

function parseJson(val) {
  if (!val) return [];
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return []; }
}

function normalizeTindakan(arr) {
  return arr.map((item) =>
    typeof item === 'object' && item !== null
      ? { text: String(item.text || ''), done: Boolean(item.done) }
      : { text: String(item || ''), done: false }
  );
}

function formatRow(row) {
  return {
    ...row,
    penyebab: normalizePenyebab(parseJson(row.penyebab)),
    tindakan: normalizeTindakan(parseJson(row.tindakan)),
    created_at_wib: row.created_at
      ? new Date(row.created_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
      : null,
    updated_at_wib: row.updated_at
      ? new Date(row.updated_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
      : null,
  };
}

function normalizePenyebab(arr) {
  return arr.map((item) => String(item || ''));
}

// ── GET ───────────────────────────────────────────────────
export async function GET() {
  try {
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM reports ORDER BY created_at DESC');
      return Response.json(rows.map(formatRow));
    }

    const { data, error } = await supabase
      .from('reports').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return Response.json((data || []).map(formatRow));
  } catch (err) {
    console.error('RCA Reports GET Error:', err);
    return Response.json({ error: 'Gagal mengambil daftar laporan' }, { status: 500 });
  }
}

// ── POST ──────────────────────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json();
    const name = body.name?.trim();
    const nip  = body.nip?.trim();
    if (!name || !nip) {
      return Response.json({ error: 'Nama dan NIP wajib diisi' }, { status: 400 });
    }

    const id       = body.id || crypto.randomUUID();
    const now      = body.created_at ? new Date(body.created_at).toISOString() : new Date().toISOString();
    const penyebab = Array.isArray(body.penyebab) ? body.penyebab.map(String) : [];
    const tindakan = Array.isArray(body.tindakan) ? normalizeTindakan(body.tindakan) : [];

    if (useMySQL) {
      const nowMy = now.slice(0, 19).replace('T', ' ');
      await pool.query(
        `INSERT INTO reports
          (id,name,nip,judul,ringkasan,root_cause,penyebab,tindakan,
           transcript,original_transcript,language,
           created_by_user_id,created_by_user_name,
           updated_by_user_id,updated_by_user_name,
           created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          id, name, nip,
          body.judul || 'Laporan Tanpa Judul',
          body.ringkasan || '', body.root_cause || '',
          JSON.stringify(penyebab), JSON.stringify(tindakan),
          body.transcript || '', body.original_transcript ?? null,
          body.language || 'id',
          null, name, null, null,
          nowMy, nowMy,
        ]
      );
      const [rows] = await pool.query('SELECT * FROM reports WHERE id = ?', [id]);
      const saved = formatRow(rows[0]);
      await sendTelegramNotification(saved);
      return Response.json(saved, { status: 201 });
    }

    const report = {
      id, name, nip,
      judul: body.judul || 'Laporan Tanpa Judul',
      ringkasan: body.ringkasan || '',
      root_cause: body.root_cause || '',
      penyebab, tindakan,
      transcript: body.transcript || '',
      original_transcript: body.original_transcript ?? null,
      language: body.language || 'id',
      created_by_user_id: null,
      created_by_user_name: name,
      updated_by_user_id: null,
      updated_by_user_name: null,
      created_at: now, updated_at: now,
    };
    const { data, error } = await supabase.from('reports').insert([report]).select();
    if (error) throw error;
    const saved = formatRow(data?.[0] || report);
    await sendTelegramNotification(saved);
    return Response.json(saved, { status: 201 });
  } catch (err) {
    console.error('RCA Reports POST Error:', err);
    return Response.json({ error: 'Gagal menyimpan laporan', details: err?.message }, { status: 500 });
  }
}
