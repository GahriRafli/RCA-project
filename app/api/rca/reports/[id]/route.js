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
  };
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const [rows] = await pool.query('SELECT * FROM reports WHERE id = ?', [id]);
    if (!rows.length) return Response.json({ error: 'Laporan tidak ditemukan' }, { status: 404 });
    return Response.json(formatReport(rows[0]));
  } catch (err) {
    console.error('RCA Report GET Error:', err);
    return Response.json({ error: 'Gagal mengambil laporan' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const penyebab = Array.isArray(body.penyebab) ? body.penyebab.map(String) : [];
    const tindakan = Array.isArray(body.tindakan) ? normalizeTindakan(body.tindakan) : [];

    await pool.query(
      `UPDATE reports SET
        name=?, nip=?, judul=?, ringkasan=?, root_cause=?,
        penyebab=?, tindakan=?, transcript=?, original_transcript=?,
        language=?, updated_by_user_id=?, updated_by_user_name=?, updated_at=?
       WHERE id=?`,
      [
        body.name?.trim() || '',
        body.nip?.trim()  || '',
        body.judul        || '',
        body.ringkasan    || '',
        body.root_cause   || '',
        JSON.stringify(penyebab),
        JSON.stringify(tindakan),
        body.transcript          || '',
        body.original_transcript ?? null,
        body.language || 'id',
        body.updated_by_user_id  || null,
        body.updated_by_user_name || null,
        now,
        id,
      ]
    );

    const [rows] = await pool.query('SELECT * FROM reports WHERE id = ?', [id]);
    if (!rows.length) return Response.json({ error: 'Laporan tidak ditemukan' }, { status: 404 });
    return Response.json(formatReport(rows[0]));
  } catch (err) {
    console.error('RCA Report PUT Error:', err);
    return Response.json({ error: 'Gagal memperbarui laporan', details: err?.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await pool.query('DELETE FROM reports WHERE id = ?', [id]);
    return Response.json({ success: true });
  } catch (err) {
    console.error('RCA Report DELETE Error:', err);
    return Response.json({ error: 'Gagal menghapus laporan' }, { status: 500 });
  }
}
