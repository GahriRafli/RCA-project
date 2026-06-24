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

    const hfToken = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_TOKEN;
    if (!hfToken) {
      return Response.json({ error: 'HF_TOKEN belum dikonfigurasi' }, { status: 500 });
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
   - "kena serangan jantung massal" → ganti dengan deskripsi dampak faktual
   - "bom waktu yang meledak" → "menyebabkan konflik yang akhirnya memicu kegagalan"
   - "musuh dalam selimut" → "justru menjadi penyebab masalah"
   - "bolong-bolong kayak keju swiss" → "tidak lengkap"
   - "kayak janji politisi" → hapus total, tidak ada nilai faktual
   - "pemadam kebakaran yang telat" → "tim baru mengetahui masalah setelah terjadi"
   - "gedung udah hampir rubuh" → hapus, deskripsikan kondisi aktualnya saja

5. KATA KASAR & EKSPRESI EMOSIONAL: Hapus total tanpa diganti apapun. Contoh: "anjir", "sial", "brengsek", "kampret", "sialan", dan sejenisnya.

6. KONTEN TIDAK RELEVAN: Hapus total kalimat/potongan yang tidak relevan dengan laporan insiden — misalnya obrolan ke orang lain yang terekam, instruksi ke perangkat, atau interupsi rekaman. Contoh: "matiin tv dulu", "heh kamu ngapain", "sebentar ada telepon".

7. AKRONIM & SINGKATAN TEKNIS: Kenali dari konteks dan tulis dalam format baku huruf kapital, meski di input ditulis salah karena speech-to-text. Contoh: "si api key" → "API key", "hris" → "HRIS", "ats" → "ATS", "pic" → "PIC", "sop" → "SOP", "es el a" → "SLA".

8. CODE-SWITCHING (campur bahasa): Terjemahkan kata/frasa bahasa Inggris yang bukan istilah teknis baku ke ${lang} formal. Contoh: "our team" → "tim kami", "the root cause" → "akar masalah", "obviously" → hapus atau ganti "tentu saja". PERTAHANKAN istilah teknis IT/industri yang lazim dipakai dalam bahasa Indonesia seperti: rollback, deployment, staging, API key, full table scan, latency, alert threshold, downtime, escalation.

9. JANGAN menambahkan informasi yang tidak ada di teks asli.
10. JANGAN menyimpulkan, menganalisis, atau membuat kesimpulan — murni perapian teks.
11. Output harus dalam ${lang}.
12. Jawab HANYA dengan teks yang sudah dirapikan, tanpa penjelasan, catatan, atau komentar apapun.

Teks asli:
"""
${transcript}
"""

Teks yang sudah dirapikan:`;

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
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`HuggingFace API error: ${res.status} ${txt}`);
    }

    const data = await res.json();
    const enhanced = data?.choices?.[0]?.message?.content?.trim() || '';

    if (!enhanced) throw new Error('HuggingFace tidak mengembalikan teks');

    return Response.json({ enhanced });
  } catch (err) {
    console.error('RCA Enhance Error:', err);
    return Response.json(
      { error: `Gagal merapikan teks: ${err.message || err}` },
      { status: 500 }
    );
  }
}
