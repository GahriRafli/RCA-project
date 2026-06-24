import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { transcript, language } = body || {};

    if (!transcript || transcript.trim().length === 0) {
      return Response.json({ error: 'Transkrip tidak boleh kosong' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'GEMINI_API_KEY belum dikonfigurasi' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    const lang = language === 'en' ? 'English' : 'Bahasa Indonesia';

    const prompt = `Kamu adalah editor teks profesional. Tugasmu adalah HANYA merapikan teks transkrip berikut, TANPA mengubah fakta, angka, nama, atau makna aslinya.

ATURAN WAJIB:
1. Hilangkan filler words dan disfluensi bicara (contoh: "eh", "anu", "jadi gini", "apa namanya", pengulangan kata yang tidak perlu).
2. Rapikan struktur kalimat agar lebih jelas dan mudah dibaca.
3. Perbaiki ejaan terminologi teknis yang mungkin salah ditranskripsi (misal: bearing, fiber optik, kalibrasi, under-frequency, metana, dll).
4. JANGAN menambahkan informasi yang tidak ada di teks asli.
5. JANGAN menyimpulkan, menganalisis, atau membuat kesimpulan — murni perapian teks.
6. JANGAN mengubah bahasa output — jika input ${lang}, output harus ${lang}.
7. Jawab HANYA dengan teks yang sudah dirapikan, tanpa penjelasan atau komentar apapun.

Teks asli:
"""
${transcript}
"""

Teks yang sudah dirapikan:`;

    const result = await model.generateContent(prompt);
    const enhanced = result.response.text().trim();

    return Response.json({ enhanced });
  } catch (err) {
    console.error('RCA Enhance Error:', err);
    return Response.json(
      { error: `Gagal merapikan teks: ${err.message || err}` },
      { status: 500 }
    );
  }
}
