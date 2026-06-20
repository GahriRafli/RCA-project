# Panduan Deploy Laporan Suara RCA ke Vercel

Fitur **Laporan Suara RCA** menggunakan serverless API endpoints dan database **Upstash Redis**. Ikuti langkah-langkah di bawah ini untuk deploy ke Vercel dan menyambungkan databasenya secara gratis.

---

## Langkah 1: Siapkan Environment Variables

Anda membutuhkan dua jenis API key/credential:
1. **Google Gemini API Key** (Gratis)
   - Buka [Google AI Studio](https://aistudio.google.com/)
   - Buat API key baru secara gratis
   - Simpan key ini sebagai `GEMINI_API_KEY`

2. **Upstash Redis Credentials** (Gratis)
   - Registrasi/Login ke [Upstash Console](https://console.upstash.com/)
   - Buat database Redis baru (pilih regional terdekat, misal `ap-southeast-1` Singapura)
   - Dapatkan `UPSTASH_REDIS_REST_URL` dan `UPSTASH_REDIS_REST_TOKEN` dari tab **REST API** di dashboard Upstash.

---

## Langkah 2: Hubungkan Project ke Vercel

Ada dua cara untuk mendeploy project Anda ke Vercel:

### Opsi A: Deploy via Vercel Web Dashboard (Sangat Direkomendasikan)
1. **Push Code ke Git Provider**: Push seluruh source code project Anda ke GitHub, GitLab, atau Bitbucket.
2. **Login ke Vercel**: Buka [Vercel Dashboard](https://vercel.com/dashboard) dan login menggunakan akun Git Anda.
3. **Import Project**: 
   - Klik tombol **"Add New"** lalu pilih **"Project"**.
   - Pilih repository Git project Anda dari daftar yang muncul, kemudian klik **"Import"**.
4. **Konfigurasi Project**:
   - Di bagian **Configure Project**, biarkan Framework Preset mendeteksi **Next.js** secara otomatis.
   - Buka bagian **Environment Variables**.
   - Masukkan key dan value berikut satu per satu:
     * **`GEMINI_API_KEY`** = *(API key dari Google AI Studio)*
     * **`UPSTASH_REDIS_REST_URL`** = *(URL dari Upstash REST API)*
     * **`UPSTASH_REDIS_REST_TOKEN`** = *(Token dari Upstash REST API)*
5. **Deploy**: Klik tombol **"Deploy"**. Vercel akan otomatis memproses build dan memberikan Anda public domain (misalnya: `remittance-rca-xxxx.vercel.app`).
   *Catatan: Setiap kali Anda melakukan `git push` ke branch utama, Vercel akan otomatis melakukan deploy ulang.*

### Opsi B: Deploy via Vercel CLI (Terminal)
1. Buka terminal di root directory project Anda.
2. Jalankan perintah `vercel` (jika belum menginstall Vercel CLI, jalankan `npm i -g vercel` terlebih dahulu):
   ```bash
   vercel login
   vercel link
   ```
3. Tambahkan environment variables yang telah disiapkan ke project Vercel Anda:
   ```bash
   vercel env add GEMINI_API_KEY
   vercel env add UPSTASH_REDIS_REST_URL
   vercel env add UPSTASH_REDIS_REST_TOKEN
   ```
   *Pilih untuk memasukkan environment variables ini ke environment `Production`, `Preview`, dan `Development`.*
4. Deploy ke Vercel dengan menjalankan perintah:
   ```bash
   vercel --prod
   ```

Setelah deploy selesai, Vercel akan memberikan domain public (contoh: `remittance-rca-xxxx.vercel.app`). Fitur Laporan RCA dapat langsung diakses melalui `/rca` di browser laptop maupun smartphone Anda.

---

## Menggunakan Integrasi Vercel Marketplace (Alternatif Setup Redis)

Daripada membuat database di Upstash secara manual, Anda juga bisa menggunakan integrasi resmi di Vercel:
1. Masuk ke dashboard project Anda di [Vercel](https://vercel.com)
2. Klik tab **Integrations**
3. Cari **Upstash Redis** dan klik **Add Integration**
4. Ikuti setup wizard untuk membuat database gratis. Vercel akan otomatis menambahkan environment variable `UPSTASH_REDIS_REST_URL` dan `UPSTASH_REDIS_REST_TOKEN` ke project Anda tanpa setup manual.
