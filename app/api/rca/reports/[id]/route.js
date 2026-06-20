import { supabase } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return Response.json({ error: 'Laporan tidak ditemukan' }, { status: 404 });
    }

    return Response.json(data);
  } catch (err) {
    console.error('RCA Report GET Error:', err);
    return Response.json({ error: 'Gagal mengambil laporan' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const updates = await request.json();

    const now = new Date().toISOString();
    const updatedData = {
      ...updates,
      id, // Ensure ID is not overwritten
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('reports')
      .update(updatedData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return Response.json({ error: 'Laporan tidak ditemukan' }, { status: 404 });
    }

    return Response.json(data);
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
