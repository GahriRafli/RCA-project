import { supabase } from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const id = body.id || crypto.randomUUID();
    const ts = body.ts ? new Date(body.ts).toISOString() : new Date().toISOString();

    const loginRow = {
      id,
      user_id: body.user_id || null,
      name: body.name || null,
      nip: body.nip || null,
      ts,
      ua: body.ua || null,
      ip: body.ip || null,
    };

    const { data, error } = await supabase.from('logins').insert([loginRow]).select();
    if (error) throw error;

    return new Response(JSON.stringify(data?.[0] || loginRow), { status: 201 });
  } catch (err) {
    console.error('Auth logins POST Error:', err);
    return new Response(JSON.stringify({ error: 'Gagal mencatat login' }), { status: 500 });
  }
}
