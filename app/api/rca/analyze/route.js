import { supabase } from '@/lib/db';

// Fitur 2: Ambil 20 laporan terakhir sebagai knowledge internal
// Tidak mengambil name/nip/transcript untuk menjaga privasi & hemat token
async function fetchKnowledgeContext() {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('judul, root_cause, penyebab, tindakan')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !data || data.length === 0) return '';

    const MAX_KNOWLEDGE_CHARS = 4000;
    let knowledgeBlock = '';

    for (const report of data) {
      const tindakanList = Array.isArray(report.tindakan)
        ? report.tindakan.map((t) => (typeof t === 'object' ? t.text : t)).filter(Boolean).slice(0, 5).join('; ')
        : '';
      const penyebabList = Array.isArray(report.penyebab)
        ? report.penyebab.slice(0, 3).join('; ')
        : '';

      const entry = `- Judul: ${report.judul || '-'} | Root Cause: ${report.root_cause || '-'} | Penyebab: ${penyebabList || '-'} | Solusi: ${tindakanList || '-'}\n`;

      if (knowledgeBlock.length + entry.length > MAX_KNOWLEDGE_CHARS) break;
      knowledgeBlock += entry;
    }

    return knowledgeBlock;
  } catch {
    return '';
  }
}

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error('Invalid JSON body for /api/rca/analyze:', e);
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { transcript, language } = body || {};

    if (!transcript || transcript.trim().length === 0) {
      return Response.json({ error: 'Transkrip tidak boleh kosong' }, { status: 400 });
    }

    const hfToken = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_TOKEN;
    if (!hfToken) {
      return Response.json(
        { error: 'HF_TOKEN belum dikonfigurasi di server' },
        { status: 500 }
      );
    }

    // Fitur 2: Ambil knowledge dari laporan sebelumnya
    const knowledgeContext = await fetchKnowledgeContext();
    const knowledgeSection = knowledgeContext
      ? `\nBASIS PENGETAHUAN INSIDEN SEBELUMNYA (dari laporan RCA yang pernah dibuat di organisasi ini):
${knowledgeContext}
Gunakan pola solusi di atas sebagai referensi saat menyusun rekomendasi untuk insiden baru ini. Tandai rekomendasi dari basis ini dengan sumber "internal".\n`
      : '';

    const lang = language === 'en' ? 'English' : 'Bahasa Indonesia';

    const prompt = `Kamu adalah analis RCA (Root Cause Analysis) profesional di bidang IT Operations.

Tugas: Analisis transkrip laporan masalah berikut dan hasilkan laporan RCA terstruktur dalam ${lang}.
${knowledgeSection}
ATURAN PENTING:
- HANYA gunakan informasi yang ADA di transkrip untuk field judul, ringkasan, root_cause, penyebab, dan tindakan. JANGAN mengarang atau menambahkan informasi yang tidak disebutkan.
- Jika suatu informasi tidak tersedia di transkrip, kosongkan field tersebut (string kosong atau array kosong).
- Untuk field "rekomendasi": boleh menggunakan pola dari basis pengetahuan internal (tandai sumber "internal") dan/atau best practice industri yang relevan (tandai sumber "industri"). Jika tidak ada rekomendasi yang relevan, kembalikan array kosong.
- JANGAN mengarang rekomendasi yang tidak relevan dengan insiden.
- Jawab HANYA dalam format JSON yang valid, tanpa teks tambahan apapun di luar JSON.

Transkrip:
"""
${transcript}
"""

Format JSON yang HARUS diikuti (jawab HANYA JSON ini, tanpa markdown code block):
{
  "judul": "Judul singkat laporan (maks 10 kata)",
  "ringkasan": "Ringkasan masalah dalam 1-2 kalimat",
  "root_cause": "Akar masalah utama yang teridentifikasi dari transkrip",
  "penyebab": ["Faktor penyebab 1", "Faktor penyebab 2"],
  "tindakan": [
    {"text": "Langkah tindakan penyelesaian 1", "done": false},
    {"text": "Langkah tindakan penyelesaian 2", "done": false}
  ],
  "rekomendasi": [
    {"isi": "Teks rekomendasi konkret dari pola laporan sebelumnya", "sumber": "internal"},
    {"isi": "Teks rekomendasi best practice industri", "sumber": "industri"}
  ]
}`;

    const res = await fetch('https://router.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.3-70B-Instruct',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2048,
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`HuggingFace API error: ${res.status} ${txt}`);
    }

    const hfData = await res.json();
    let responseText = hfData?.choices?.[0]?.message?.content || '';

    if (!responseText.trim()) {
      throw new Error('HuggingFace tidak mengembalikan konten');
    }

    // Bersihkan markdown code block jika ada
    let cleaned = responseText.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    // Ekstrak JSON jika ada teks sebelum/sesudah kurung kurawal
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleaned = jsonMatch[0];

    let analysis;
    try {
      analysis = JSON.parse(cleaned);
    } catch {
      return Response.json(
        { error: 'AI mengembalikan format yang tidak valid. Silakan coba lagi.', raw: cleaned },
        { status: 422 }
      );
    }

    // Validasi dan normalisasi — field lama tetap identik, rekomendasi sebagai tambahan
    const normalized = {
      judul: typeof analysis.judul === 'string' ? analysis.judul : '',
      ringkasan: typeof analysis.ringkasan === 'string' ? analysis.ringkasan : '',
      root_cause: typeof analysis.root_cause === 'string' ? analysis.root_cause : '',
      penyebab: Array.isArray(analysis.penyebab)
        ? analysis.penyebab.filter(p => typeof p === 'string')
        : [],
      tindakan: Array.isArray(analysis.tindakan)
        ? analysis.tindakan
            .filter(t => t && typeof t.text === 'string')
            .map(t => ({ text: t.text, done: Boolean(t.done) }))
        : [],
      // Fitur 3: field rekomendasi baru
      rekomendasi: Array.isArray(analysis.rekomendasi)
        ? analysis.rekomendasi
            .filter(r => r && typeof r.isi === 'string' && r.isi.trim())
            .map(r => ({
              isi: r.isi.trim(),
              sumber: r.sumber === 'internal' ? 'internal' : 'industri',
            }))
        : [],
    };

    return Response.json(normalized);
  } catch (err) {
    console.error('RCA Analyze Error:', err);
    return Response.json(
      { error: `Gagal menganalisis transkrip: ${err.message || err}` },
      { status: 500 }
    );
  }
}
