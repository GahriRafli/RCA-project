import pool, { useMySQL, supabase } from '@/lib/db';
import { callAI, extractJSON } from '@/lib/ai';

export async function GET() {
  try {
    let rows;
    if (useMySQL) {
      const [result] = await pool.query(
        'SELECT root_cause FROM reports WHERE root_cause IS NOT NULL AND root_cause != "" ORDER BY created_at DESC LIMIT 100'
      );
      rows = result;
    } else {
      const { data, error } = await supabase
        .from('reports')
        .select('root_cause')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      rows = data;
    }

    const rootCauses = (rows || [])
      .map((r) => r.root_cause?.trim())
      .filter(Boolean);

    if (rootCauses.length < 3) {
      return Response.json(
        { top_issues: [], message: 'Belum cukup data untuk analisis recurring issues' },
        {
          status: 200,
          headers: { 'Cache-Control': 's-maxage=300' },
        }
      );
    }

    const listFormatted = rootCauses.map((rc, i) => `${i + 1}. ${rc}`).join('\n');

    const prompt = `Berikut adalah daftar root cause dari laporan insiden yang tersimpan.
Kelompokkan root cause-root cause ini berdasarkan kemiripan tema/isu yang mendasarinya.
Identifikasi 5 kelompok/tema yang paling sering muncul.

Kembalikan HANYA JSON berikut tanpa teks lain, tanpa markdown:
{
  "top_issues": [
    {
      "tema": "label singkat tema isu (maks 6 kata)",
      "jumlah": <angka berapa banyak root cause yang masuk kelompok ini>,
      "contoh_root_cause": "satu contoh root cause representatif dari kelompok ini",
      "variasi": ["root cause 1", "root cause 2"]
    }
  ]
}

Urutkan dari jumlah terbanyak ke tersedikit.
Jika total laporan kurang dari 5 kelompok yang berbeda, kembalikan sebanyak kelompok yang ada saja.
Jangan mengarang kelompok yang tidak ada datanya.

Daftar root cause:
${listFormatted}`;

    const raw = await callAI({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 1024,
      temperature: 0.1,
    });

    let cleaned = extractJSON(raw);

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('Recurring issues JSON parse error, raw:', cleaned);
      return Response.json(
        { error: 'AI mengembalikan format tidak valid', top_issues: [] },
        { status: 422 }
      );
    }

    const top_issues = Array.isArray(parsed.top_issues)
      ? parsed.top_issues
          .filter((item) => item && typeof item.tema === 'string' && item.tema.trim())
          .map((item) => ({
            tema: item.tema.trim(),
            jumlah: Number(item.jumlah) || 0,
            contoh_root_cause: typeof item.contoh_root_cause === 'string' ? item.contoh_root_cause.trim() : '',
            variasi: Array.isArray(item.variasi) ? item.variasi.filter(Boolean) : [],
          }))
      : [];

    return Response.json(
      { top_issues },
      {
        status: 200,
        headers: { 'Cache-Control': 's-maxage=300' },
      }
    );
  } catch (err) {
    console.error('Recurring Issues Error:', err);
    return Response.json(
      { error: `Gagal mengambil recurring issues: ${err.message || err}`, top_issues: [] },
      { status: 500 }
    );
  }
}
