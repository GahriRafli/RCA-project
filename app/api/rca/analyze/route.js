import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request) {
  try {
    const { transcript, language } = await request.json();

    if (!transcript || transcript.trim().length === 0) {
      return Response.json(
        { error: 'Transkrip tidak boleh kosong' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: 'GEMINI_API_KEY belum dikonfigurasi di server' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const lang = language === 'en' ? 'English' : 'Bahasa Indonesia';

    const prompt = `Kamu adalah analis RCA (Root Cause Analysis) profesional di bidang IT Operations.

Tugas: Analisis transkrip laporan masalah berikut dan hasilkan laporan RCA terstruktur dalam ${lang}.

ATURAN PENTING:
- HANYA gunakan informasi yang ADA di transkrip. JANGAN mengarang atau menambahkan informasi yang tidak disebutkan.
- Jika suatu informasi tidak tersedia di transkrip, kosongkan field tersebut (string kosong atau array kosong).
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
  ]
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Clean response — remove markdown code blocks if present
    let cleaned = responseText.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    let analysis;
    try {
      analysis = JSON.parse(cleaned);
    } catch {
      return Response.json(
        { error: 'AI mengembalikan format yang tidak valid. Silakan coba lagi.', raw: cleaned },
        { status: 422 }
      );
    }

    // Validate and normalize the structure
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
