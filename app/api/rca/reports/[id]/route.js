import { supabase } from '@/lib/db';

const REPORT_FIELDS_ALLOWED = [
  'name',
  'nip',
  'judul',
  'ringkasan',
  'root_cause',
  'penyebab',
  'tindakan',
  'transcript',
  'language',
  'created_by_user_id',
  'updated_by_user_id',
  'created_at',
  'updated_at',
];

function sanitizeReportPayload(payload) {
  const sanitized = {};
  REPORT_FIELDS_ALLOWED.forEach((key) => {
    if (payload[key] !== undefined) {
      sanitized[key] = payload[key];
    }
  });
  if (Array.isArray(sanitized.penyebab)) {
    sanitized.penyebab = sanitized.penyebab.map((item) => String(item || ''));
  } else {
    delete sanitized.penyebab;
  }
  if (Array.isArray(sanitized.tindakan)) {
    sanitized.tindakan = sanitized.tindakan.map((item) =>
      typeof item === 'object' && item !== null
        ? { text: String(item.text || ''), done: Boolean(item.done) }
        : { text: String(item || ''), done: false }
    );
  } else {
    delete sanitized.tindakan;
  }
  return sanitized;
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id);

    if (error) {
      console.error('Supabase get report error:', error);
      return Response.json({ error: 'Gagal mengambil laporan', details: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return Response.json({ error: 'Laporan tidak ditemukan' }, { status: 404 });
    }

    return Response.json(data[0]);
  } catch (err) {
    console.error('RCA Report GET Error:', err);
    return Response.json({ error: 'Gagal mengambil laporan' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const updates = sanitizeReportPayload(await request.json());

    const now = new Date().toISOString();
    const updatedData = {
      ...updates,
      updated_at: now,
    };

    // If updates include user ids, resolve their names server-side
    if (updatedData.created_by_user_id) {
      const { data: udata, error: uerr } = await supabase.from('users').select('name').eq('id', updatedData.created_by_user_id).limit(1);
      if (!uerr && Array.isArray(udata) && udata.length > 0) {
        updatedData.created_by_user_name = udata[0].name || null;
      }
    }
    if (updatedData.updated_by_user_id) {
      const { data: udata2, error: uerr2 } = await supabase.from('users').select('name').eq('id', updatedData.updated_by_user_id).limit(1);
      if (!uerr2 && Array.isArray(udata2) && udata2.length > 0) {
        updatedData.updated_by_user_name = udata2[0].name || null;
      }
    }

    const { data, error } = await supabase
      .from('reports')
      .update(updatedData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Supabase update error:', error, 'payload:', JSON.stringify(updatedData));
      return Response.json({ error: 'Gagal memperbarui laporan', details: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return Response.json({ error: 'Laporan tidak ditemukan' }, { status: 404 });
    }

    return Response.json(data[0]);
  } catch (err) {
    console.error('RCA Report PUT Error:', err);
    return Response.json({ error: 'Gagal memperbarui laporan' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      return Response.json({ error: 'Laporan tidak ditemukan' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('RCA Report DELETE Error:', err);
    return Response.json({ error: 'Gagal menghapus laporan' }, { status: 500 });
  }
}
