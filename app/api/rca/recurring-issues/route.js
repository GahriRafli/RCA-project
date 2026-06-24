import { supabase } from '@/lib/db';

export async function GET() {
  try {
    // Query root_cause dari 100 laporan terbaru, filter null/kosong
    const { data, error } = await supabase
      .from('reports')
      .select('root_cause')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const rootCauses = (data || [])
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

    const hfToken = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_TOKEN;
    if (!hfToken) {
      return Response.json({ error: 'HF_TOKEN belum dikonfigurasi' }, { status: 500 });
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

    const res = await fetch('https://router.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.3-70B-Instruct',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1024,
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`HuggingFace API error: ${res.status} ${txt}`);
    }

    const hfData = await res.json();
    let raw = hfData?.choices?.[0]?.message?.content || '';

    // Strip markdown fence jika ada
    let cleaned = raw.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }
    // Ekstrak JSON object
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleaned = jsonMatch[0];

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
