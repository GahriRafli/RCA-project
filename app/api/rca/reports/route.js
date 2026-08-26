import pool from '@/lib/db';

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

function formatReport(row) {
  return {
    ...row,
    penyebab: parseJson(row.penyebab),
    tindakan: normalizeTindakan(parseJson(row.tindakan)),
    created_at_wib: row.created_at
      ? new Date(row.created_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
      : null,
    updated_at_wib: row.updated_at
      ? new Date(row.updated_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
      : null,
  };
}

export async function GET() {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM reports ORDER BY created_at DESC'
    );
    return Response.json(rows.map(formatReport));
  } catch (err) {
    console.error('RCA Reports GET Error:', err);
    return Response.json({ error: 'Gagal mengambil daftar laporan' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const name = body.name?.trim();
    const nip  = body.nip?.trim();
    if (!name || !nip) {
      return Response.json(
        { error: 'Nama dan NIP wajib diisi untuk menyimpan laporan RCA' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const id  = body.id || crypto.randomUUID();

    const penyebab = Array.isArray(body.penyebab) ? body.penyebab.map(String) : [];
    const tindakan = Array.isArray(body.tindakan) ? normalizeTindakan(body.tindakan) : [];

    await pool.query(
      `INSERT INTO reports
        (id, name, nip, judul, ringkasan, root_cause, penyebab, tindakan,
         transcript, original_transcript, language,
         created_by_user_id, created_by_user_name,
         updated_by_user_id, updated_by_user_name,
         created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, name, nip,
        body.judul || 'Laporan Tanpa Judul',
        body.ringkasan || '',
        body.root_cause || '',
        JSON.stringify(penyebab),
        JSON.stringify(tindakan),
        body.transcript || '',
        body.original_transcript ?? null,
        body.language || 'id',
        body.created_by_user_id || null,
        name,
        body.updated_by_user_id || null,
        null,
        now, now,
      ]
    );

    const [rows] = await pool.query('SELECT * FROM reports WHERE id = ?', [id]);
    return Response.json(formatReport(rows[0]), { status: 201 });
  } catch (err) {
    console.error('RCA Reports POST Error:', err);
    return Response.json({ error: 'Gagal menyimpan laporan', details: err?.message }, { status: 500 });
  }
}
