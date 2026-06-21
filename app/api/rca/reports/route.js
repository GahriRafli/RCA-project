import { supabase } from '@/lib/db';

const REPORT_FIELDS_ALLOWED = [
  'id',
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
    sanitized.penyebab = [];
  }
  if (Array.isArray(sanitized.tindakan)) {
    sanitized.tindakan = sanitized.tindakan.map((item) =>
      typeof item === 'object' && item !== null
        ? { text: String(item.text || ''), done: Boolean(item.done) }
        : { text: String(item || ''), done: false }
    );
  } else {
    sanitized.tindakan = [];
  }
  return sanitized;
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    // Convert timestamps to WIB display strings
    const mapped = (data || []).map((r) => ({
      ...r,
      created_at_wib: r.created_at ? new Date(r.created_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : null,
      updated_at_wib: r.updated_at ? new Date(r.updated_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : null,
    }));

    return Response.json(mapped);
  } catch (err) {
    console.error('RCA Reports GET Error (SQL):', err);
    return Response.json({ error: 'Gagal mengambil daftar laporan' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = sanitizeReportPayload(await request.json());

    if (!body.name || !body.name.trim() || !body.nip || !body.nip.trim()) {
      return Response.json(
        { error: 'Nama dan NIP wajib diisi untuk menyimpan laporan RCA' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const id = body.id || crypto.randomUUID();

    const report = {
      id,
      name: body.name.trim(),
      nip: body.nip.trim(),
      judul: body.judul || 'Laporan Tanpa Judul',
      ringkasan: body.ringkasan || '',
      root_cause: body.root_cause || '',
      penyebab: body.penyebab || [],
      tindakan: body.tindakan || [],
      transcript: body.transcript || '',
      language: body.language || 'id',
      created_by_user_id: body.created_by_user_id || null,
      created_by_user_name: null,
      updated_by_user_id: body.updated_by_user_id || null,
      updated_by_user_name: null,
      created_at: body.created_at || now,
      updated_at: now,
    };

    // If a created_by_user_id is provided, resolve the user's name server-side
    if (report.created_by_user_id) {
      const { data: udata, error: uerr } = await supabase.from('users').select('name').eq('id', report.created_by_user_id).limit(1);
      if (!uerr && Array.isArray(udata) && udata.length > 0) {
        report.created_by_user_name = udata[0].name || null;
      }
    }

    if (report.updated_by_user_id) {
      const { data: udata2, error: uerr2 } = await supabase.from('users').select('name').eq('id', report.updated_by_user_id).limit(1);
      if (!uerr2 && Array.isArray(udata2) && udata2.length > 0) {
        report.updated_by_user_name = udata2[0].name || null;
      }
    }

    const { data, error } = await supabase.from('reports').insert([report]).select();
    if (error) throw error;

    return Response.json(data?.[0] || report, { status: 201 });
  } catch (err) {
    console.error('RCA Reports POST Error (SQL):', err);
    return Response.json({
      error: 'Gagal menyimpan laporan',
      details: err?.message || null,
    }, { status: 500 });
  }
}
