import pool, { useMySQL, supabase } from '@/lib/db';

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
    penyebab: parseJson(row.penyebab).map(String),
    tindakan: normalizeTindakan(parseJson(row.tindakan)),
  };
}

// ── GET ───────────────────────────────────────────────────
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (useMySQL) {
      const [rows] = await pool.query('SELECT * FROM reports WHERE id = ?', [id]);
      if (!rows.length) return Response.json({ error: 'Laporan tidak ditemukan' }, { status: 404 });
      return Response.json(formatRow(rows[0]));
    }
    const { data, error } = await supabase.from('reports').select('*').eq('id', id);
    if (error) throw error;
    if (!data?.length) return Response.json({ error: 'Laporan tidak ditemukan' }, { status: 404 });
    return Response.json(formatRow(data[0]));
  } catch (err) {
    console.error('RCA Report GET Error:', err);
    return Response.json({ error: 'Gagal mengambil laporan' }, { status: 500 });
  }
}

// ── PUT ───────────────────────────────────────────────────
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const now  = new Date().toISOString();
    const penyebab = Array.isArray(body.penyebab) ? body.penyebab.map(String) : [];
    const tindakan = Array.isArray(body.tindakan) ? normalizeTindakan(body.tindakan) : [];

    if (useMySQL) {
      const nowMy = now.slice(0, 19).replace('T', ' ');
      await pool.query(
        `UPDATE reports SET
          name=?,nip=?,judul=?,ringkasan=?,root_cause=?,
          penyebab=?,tindakan=?,transcript=?,original_transcript=?,
          language=?,updated_by_user_id=?,updated_by_user_name=?,updated_at=?
         WHERE id=?`,
        [
          body.name?.trim() || '', body.nip?.trim() || '',
          body.judul || '', body.ringkasan || '', body.root_cause || '',
          JSON.stringify(penyebab), JSON.stringify(tindakan),
          body.transcript || '', body.original_transcript ?? null,
          body.language || 'id',
          body.updated_by_user_id || null,
          body.updated_by_user_name || null,
          nowMy, id,
        ]
      );
      const [rows] = await pool.query('SELECT * FROM reports WHERE id = ?', [id]);
      if (!rows.length) return Response.json({ error: 'Laporan tidak ditemukan' }, { status: 404 });
      return Response.json(formatRow(rows[0]));
    }

    const updates = {
      name: body.name?.trim() || '',
      nip: body.nip?.trim() || '',
      judul: body.judul || '',
      ringkasan: body.ringkasan || '',
      root_cause: body.root_cause || '',
      penyebab, tindakan,
      transcript: body.transcript || '',
      original_transcript: body.original_transcript ?? null,
      language: body.language || 'id',
      updated_by_user_id: body.updated_by_user_id || null,
      updated_by_user_name: body.updated_by_user_name || null,
      updated_at: now,
    };
    const { data, error } = await supabase.from('reports').update(updates).eq('id', id).select();
    if (error) throw error;
    if (!data?.length) return Response.json({ error: 'Laporan tidak ditemukan' }, { status: 404 });
    return Response.json(formatRow(data[0]));
  } catch (err) {
    console.error('RCA Report PUT Error:', err);
    return Response.json({ error: 'Gagal memperbarui laporan', details: err?.message }, { status: 500 });
  }
}

// ── DELETE ────────────────────────────────────────────────
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    if (useMySQL) {
      await pool.query('DELETE FROM reports WHERE id = ?', [id]);
    } else {
      const { error } = await supabase.from('reports').delete().eq('id', id);
      if (error) throw error;
    }
    return Response.json({ success: true });
  } catch (err) {
    console.error('RCA Report DELETE Error:', err);
    return Response.json({ error: 'Gagal menghapus laporan' }, { status: 500 });
  }
}
