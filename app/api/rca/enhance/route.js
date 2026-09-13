import { callAI } from '@/lib/ai';

export async function POST(request) {
  try {
    let body;
    try { body = await request.json(); } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { transcript, language } = body || {};
    if (!transcript || transcript.trim().length === 0) {
      return Response.json({ error: 'Transkrip tidak boleh kosong' }, { status: 400 });
    }

    const lang = language === 'en' ? 'English' : 'Bahasa Indonesia';

    const prompt = `Kamu adalah editor teks profesional untuk laporan insiden teknis. Tugasmu adalah HANYA merapikan teks transkrip berikut agar menjadi laporan yang bersih, faktual, dan profesional — TANPA mengubah fakta, angka, nama sistem, atau makna substansialnya.

ATURAN WAJIB — ikuti semua tanpa terkecuali:

1. FILLER WORDS & DISFLUENSI: Hapus semua filler words dan disfluensi bicara seperti "eh", "anu", "jadi gini", "apa namanya", "ya kan", "gitu loh", "emm", "hmm", serta pengulangan kata yang tidak perlu.

2. PERAPIAN KALIMAT: Rapikan struktur kalimat agar lebih jelas dan mudah dibaca. Jangan mengubah atau menghilangkan fakta, angka, nama teknis, atau makna asli.

3. TERMINOLOGI TEKNIS: Perbaiki ejaan terminologi teknis yang mungkin salah ditranskripsi oleh speech-to-text (contoh: bearing, fiber optik, kalibrasi, under-frequency, metana, rollback, deployment, staging, latency, alert threshold, dll).

4. METAFORA & UNGKAPAN FIGURATIF — WAJIB dihapus/diganti dengan deskripsi faktual netral:
   - "hari kiamat buat tim" → "gangguan besar bagi tim"
   - "mati suri total" → "tidak bisa diakses sama sekali"
   - "jantung perusahaan" → hapus, cukup sebut nama sistemnya
   - "bom waktu yang meledak" → "menyebabkan konflik yang akhirnya memicu kegagalan"
   - "bolong-bolong kayak keju swiss" → "tidak lengkap"

5. KATA KASAR & EKSPRESI EMOSIONAL: Hapus total. Contoh: "anjir", "sial", "brengsek", "kampret".

6. KONTEN TIDAK RELEVAN: Hapus total kalimat yang tidak relevan dengan laporan insiden (obrolan terekam, instruksi ke perangkat, interupsi).

7. AKRONIM & SINGKATAN TEKNIS: Tulis dalam format baku huruf kapital. Contoh: "si api key" → "API key", "hris" → "HRIS", "pic" → "PIC", "sop" → "SOP".

8. CODE-SWITCHING: Terjemahkan frasa Inggris non-teknis ke ${lang} formal. Pertahankan istilah teknis IT seperti: rollback, deployment, staging, API key, latency, downtime.

9. JANGAN menambahkan informasi yang tidak ada di teks asli.
10. JANGAN menyimpulkan atau menganalisis — murni perapian teks.
11. Output harus dalam ${lang}.
12. Jawab HANYA dengan teks yang sudah dirapikan, tanpa penjelasan apapun.

Teks asli:
"""
${transcript}
"""

Teks yang sudah dirapikan:`;

    const enhanced = await callAI({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 1024,
      temperature: 0.2,
    });

    if (!enhanced.trim()) throw new Error('AI tidak mengembalikan teks');

    return Response.json({ enhanced: enhanced.trim() });
  } catch (err) {
    console.error('RCA Enhance Error:', err);
    return Response.json({ error: `Gagal merapikan teks: ${err.message || err}` }, { status: 500 });
  }
}
