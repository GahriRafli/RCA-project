-- Fitur 4: Simpan transkrip asli sebelum auto-enhance
-- Kolom ini nullable; laporan lama atau yang tidak menggunakan enhance akan tetap NULL
ALTER TABLE reports ADD COLUMN IF NOT EXISTS original_transcript TEXT;
