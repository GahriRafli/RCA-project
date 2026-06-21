import { supabase } from '@/lib/db';

export async function GET() {
  try {
    const { data, error } = await supabase.from('users').select('id, name, nip').order('name');
    if (error) throw error;
    return Response.json(data || []);
  } catch (err) {
    console.error('Users GET Error:', err);
    return Response.json({ error: 'Gagal mengambil daftar pengguna' }, { status: 500 });
  }
}
