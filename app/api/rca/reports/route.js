import { supabase } from '@/lib/db';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return Response.json(data || []);
  } catch (err) {
    console.error('RCA Reports GET Error (SQL):', err);
    return Response.json({ error: 'Gagal mengambil daftar laporan' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

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
      created_by_user_name: body.created_by_user_name || null,
      created_by_role: body.created_by_role || null,
      updated_by_user_id: body.updated_by_user_id || null,
      updated_by_user_name: body.updated_by_user_name || null,
      updated_by_role: body.updated_by_role || null,
      created_at: body.created_at || now,
      updated_at: now,
    };

    const { data, error } = await supabase.from('reports').insert([report]).select();
    if (error) throw error;

    return Response.json(data?.[0] || report, { status: 201 });
  } catch (err) {
    console.error('RCA Reports POST Error (SQL):', err);
    return Response.json({ error: 'Gagal menyimpan laporan' }, { status: 500 });
  }
}
