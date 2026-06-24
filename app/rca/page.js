'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import {
  Mic, MicOff, Sparkles, Save, Clipboard, RefreshCw, Trash2, Plus, X,
  ListTodo, AlertTriangle, AlertCircle, Lightbulb, Copy, Undo2, CheckCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import './rca.css';

export default function RCALaporanPage() {
  // Transkrip & State Perekaman
  const [transcript, setTranscript] = useState('');
  const [originalTranscript, setOriginalTranscript] = useState(''); // Fitur 4
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState('id');
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const recognitionRef = useRef(null);

  // Fitur 1: Auto-enhance state
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceDone, setEnhanceDone] = useState(false); // badge "teks dirapikan"
  const [hasBeenEnhanced, setHasBeenEnhanced] = useState(false); // apakah sudah pernah di-enhance
  const enhanceTimerRef = useRef(null);

  // Status & Hasil Analisis AI
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [reportName, setReportName] = useState('');
  const [reportNip, setReportNip] = useState('');

  // Inisialisasi Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRecognitionSupported(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = language === 'id' ? 'id-ID' : 'en-US';

    rec.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
      }
    };

    rec.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      if (event.error !== 'no-speech') {
        toast.error(`Terjadi kesalahan perekaman: ${event.error}`);
        setIsRecording(false);
      }
    };

    rec.onend = () => {
      setIsRecording(false);
      // Fitur 1: auto-enhance saat rekaman berhenti
      setTranscript(prev => {
        if (prev.trim()) triggerEnhance(prev);
        return prev;
      });
    };

    recognitionRef.current = rec;
  }, [language]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fitur 1: fungsi enhance
  const triggerEnhance = useCallback(async (text) => {
    if (!text || !text.trim() || isEnhancing) return;
    setIsEnhancing(true);
    setEnhanceDone(false);
    try {
      const res = await fetch('/api/rca/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text, language }),
      });
      if (!res.ok) throw new Error('Enhance gagal');
      const data = await res.json();
      if (data.enhanced && data.enhanced !== text) {
        setOriginalTranscript(text); // simpan versi asli sebelum diganti
        setTranscript(data.enhanced);
        setHasBeenEnhanced(true);
        setEnhanceDone(true);
        setTimeout(() => setEnhanceDone(false), 4000); // badge hilang setelah 4 detik
      }
    } catch {
      // silent fail — jangan blokir user
    } finally {
      setIsEnhancing(false);
    }
  }, [language, isEnhancing]);

  // Fitur 1: debounce enhance saat user berhenti mengetik (2 detik)
  const handleTranscriptChange = (e) => {
    const val = e.target.value;
    setTranscript(val);
    setHasBeenEnhanced(false); // reset jika user mengedit manual

    if (enhanceTimerRef.current) clearTimeout(enhanceTimerRef.current);
    if (val.trim().length > 30) { // minimal 30 karakter agar worth di-enhance
      enhanceTimerRef.current = setTimeout(() => {
        triggerEnhance(val);
      }, 2000);
    }
  };

  // Fitur 1: urungkan perapian
  const handleUndoEnhance = () => {
    if (originalTranscript) {
      setTranscript(originalTranscript);
      setOriginalTranscript('');
      setHasBeenEnhanced(false);
      toast('Perapian diurungkan.', { icon: '↩️' });
    }
  };

  // Update bahasa recording secara dinamis
  const changeLanguage = (lang) => {
    setLanguage(lang);
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang === 'id' ? 'id-ID' : 'en-US';
    }
  };

  // Toggle Perekaman
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast.error('Browser tidak mendukung Speech Recognition.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setError('');
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        toast.success('Mulai merekam... Bicara sekarang.');
      } catch (err) {
        console.error('Gagal memulai Speech Recognition:', err);
        toast.error('Gagal memulai perekaman. Silakan coba lagi.');
      }
    }
  };

  // Analisis otomatis dengan AI
  const handleAnalyze = async () => {
    if (!reportName.trim() || !reportNip.trim()) {
      toast.error('Nama dan NIP harus diisi sebelum analisis AI.');
      return;
    }

    if (!transcript.trim()) {
      toast.error('Silakan isi transkrip atau ketik laporan terlebih dahulu.');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/rca/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, language }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.raw || `HTTP error! status: ${res.status}`);
      }

      setResult(data);
      toast.success('Analisis selesai!');
    } catch (err) {
      console.error('Front-end Analyze Error:', err);
      setError(err.message || 'Terjadi kesalahan saat menganalisis transkrip.');
      toast.error(err.message || 'Gagal menganalisis transkrip.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Penanganan Edit Hasil RCA secara Manual
  const handleFieldChange = (field, value) => {
    setResult(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field, index, value) => {
    setResult(prev => {
      const updated = [...prev[field]];
      updated[index] = value;
      return { ...prev, [field]: updated };
    });
  };

  const addArrayItem = (field, defaultValue = '') => {
    setResult(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), defaultValue]
    }));
  };

  const removeArrayItem = (field, index) => {
    setResult(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleTindakanToggle = (index) => {
    setResult(prev => {
      const updated = [...prev.tindakan];
      updated[index] = { ...updated[index], done: !updated[index].done };
      return { ...prev, tindakan: updated };
    });
  };

  const handleTindakanTextChange = (index, value) => {
    setResult(prev => {
      const updated = [...prev.tindakan];
      updated[index] = { ...updated[index], text: value };
      return { ...prev, tindakan: updated };
    });
  };

  // Fitur 3: tambahkan rekomendasi ke daftar tindakan
  const addRekomendasiAsTindakan = (isiTeks) => {
    setResult(prev => ({
      ...prev,
      tindakan: [...(prev.tindakan || []), { text: isiTeks, done: false }]
    }));
    toast.success('Rekomendasi ditambahkan ke Tindakan.');
  };

  // Simpan Laporan ke Database
  const handleSaveReport = async () => {
    if (!result) return;
    if (!reportName.trim() || !reportNip.trim()) {
      toast.error('Nama dan NIP harus diisi sebelum menyimpan laporan.');
      return;
    }

    // Fitur 4: kirim original_transcript bersama transcript
    const effectiveOriginal = hasBeenEnhanced && originalTranscript ? originalTranscript : transcript;

    const payload = {
      ...result,
      transcript,
      original_transcript: effectiveOriginal !== transcript ? effectiveOriginal : null,
      language,
      name: reportName.trim(),
      nip: reportNip.trim(),
      created_by_user_id: null,
      created_by_user_name: reportName.trim() || null,
    };

    const loadingToast = toast.loading('Menyimpan laporan...');

    try {
      const res = await fetch('/api/rca/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Gagal menyimpan laporan');

      toast.success('Laporan berhasil disimpan!', { id: loadingToast });
      handleReset();
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan laporan.', { id: loadingToast });
    }
  };

  // Reset Form
  const handleReset = () => {
    setTranscript('');
    setOriginalTranscript('');
    setHasBeenEnhanced(false);
    setEnhanceDone(false);
    setResult(null);
    setReportName('');
    setReportNip('');
    setError('');
    toast.success('Form telah direset.');
  };

  const handleCopyToClipboard = () => {
    if (!result) return;

    const template = `*LAPORAN ROOT CAUSE ANALYSIS (RCA)*

*Nama Pelapor:* ${reportName || '-'}
*NIP Pelapor:* ${reportNip || '-'}

*Judul:* ${result.judul || '-'}

*Ringkasan:* ${result.ringkasan || '-'}

*Akar Masalah (Root Cause):*
${result.root_cause || '-'}

*Faktor Penyebab:*
${result.penyebab.length > 0 ? result.penyebab.map((p, i) => `${i + 1}. ${p}`).join('\n') : '-'}

*Tindakan Penyelesaian:*
${result.tindakan.length > 0 ? result.tindakan.map((t) => `${t.done ? '[x]' : '[ ]'} ${t.text}`).join('\n') : '-'}

_Dibuat otomatis via App RCA_`;
    navigator.clipboard.writeText(template)
      .then(() => toast.success('Salin ke clipboard berhasil!'))
      .catch(() => toast.error('Gagal menyalin teks.'));
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="rca-container">

          {/* Header */}
          <div className="rca-page-header">
            <div>
              <h2>
                <div className="header-icon">
                  <Mic size={18} />
                </div>
                Aplikasi Laporan RCA
              </h2>
              <p>Dokumentasikan insiden & buat Root Cause Analysis dengan suara atau teks.</p>
            </div>
          </div>

          {/* Panel Kiri: Perekam & Transkrip */}
          <div className="rca-panel">
            <div className="rca-recorder-card">
              <div className="card-label">
                <Mic size={14} />
                Perekaman Lisan & Transkrip
              </div>

              {/* Pilihan Bahasa */}
              <div className="rca-lang-selector">
                <button
                  className={`rca-lang-btn ${language === 'id' ? 'active' : ''}`}
                  onClick={() => changeLanguage('id')}
                  disabled={isRecording}
                >
                  🇮🇩 Indonesia
                </button>
                <button
                  className={`rca-lang-btn ${language === 'en' ? 'active' : ''}`}
                  onClick={() => changeLanguage('en')}
                  disabled={isRecording}
                >
                  🇬🇧 English
                </button>
              </div>

              {/* Area Mic Utama */}
              <div className="rca-mic-area">
                <button
                  onClick={toggleRecording}
                  className={`rca-mic-btn ${isRecording ? 'recording' : ''}`}
                  title={isRecording ? 'Berhenti Perekaman' : 'Mulai Perekaman'}
                  disabled={!recognitionSupported}
                >
                  {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
                </button>

                {!recognitionSupported ? (
                  <div className="rca-mic-status unsupported">
                    <AlertTriangle size={16} />
                    Browser Anda tidak mendukung Web Speech API secara native. Silakan ketik manual atau gunakan Google Chrome.
                  </div>
                ) : (
                  <div className={`rca-mic-status ${isRecording ? 'recording' : 'idle'}`}>
                    {isRecording ? (
                      <>
                        <div className="rec-dot" />
                        Sedang Merekam... (Bicara Sekarang)
                      </>
                    ) : (
                      'Siap Merekam'
                    )}
                  </div>
                )}
              </div>

              {/* Output Transkrip */}
              <div className="rca-transcript-area">
                <div className="rca-transcript-label">
                  <span>Transkrip Teks (Bisa Diedit / Ketik Manual):</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Fitur 1: badge enhance */}
                    {isEnhancing && (
                      <span className="rca-enhance-badge loading">
                        <div className="spinner-xs" /> Merapikan...
                      </span>
                    )}
                    {enhanceDone && !isEnhancing && (
                      <span className="rca-enhance-badge done">
                        <CheckCheck size={12} /> Teks dirapikan otomatis
                      </span>
                    )}
                    {/* Fitur 1: tombol urungkan */}
                    {hasBeenEnhanced && originalTranscript && (
                      <button className="rca-undo-enhance-btn" onClick={handleUndoEnhance} title="Urungkan perapian teks">
                        <Undo2 size={12} /> Urungkan
                      </button>
                    )}
                    <span className="rca-transcript-count">{transcript.length} karakter</span>
                  </div>
                </div>
                <textarea
                  className={`rca-transcript ${isEnhancing ? 'enhancing' : ''}`}
                  value={transcript}
                  onChange={handleTranscriptChange}
                  placeholder="Ketik laporan Anda secara langsung di sini atau gunakan perekaman suara untuk mengisi otomatis."
                />
              </div>

              <div className="rca-field-group">
                <label className="rca-field-label">
                  <div className="field-indicator orange" />
                  Informasi Pelapor
                </label>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <input
                    type="text"
                    className="rca-field-input"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    placeholder="Nama lengkap"
                  />
                  <input
                    type="text"
                    className="rca-field-input"
                    value={reportNip}
                    onChange={(e) => setReportNip(e.target.value.replace(/\D/g, ''))}
                    placeholder="NIP"
                  />
                </div>
              </div>

              {/* Tombol Analisis AI */}
              <button
                className="rca-analyze-btn"
                onClick={handleAnalyze}
                disabled={isAnalyzing || isEnhancing || !transcript.trim() || !reportName.trim() || !reportNip.trim()}
              >
                {isAnalyzing ? (
                  <>
                    <div className="spinner" />
                    Menganalisis dengan AI...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Analisis dengan AI
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Panel Kanan: Hasil Analisis */}
          <div className="rca-panel">
            <div className="rca-results-card">
              <div className="card-label">
                <ListTodo size={14} />
                Laporan Hasil RCA Terstruktur
              </div>

              {error && (
                <div className="rca-error">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {!result ? (
                <div className="rca-empty-state">
                  <div className="rca-empty-icon">
                    <Sparkles size={28} />
                  </div>
                  <h3>Belum Ada Hasil Analisis</h3>
                  <p>Mulai dengan mengetik laporan Anda langsung atau merekam suara, lalu klik tombol &quot;Analisis dengan AI&quot;.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {/* Judul Laporan */}
                  <div className="rca-field-group">
                    <label className="rca-field-label">
                      <div className="field-indicator orange" />
                      Judul Laporan
                    </label>
                    <input
                      type="text"
                      className="rca-field-input"
                      value={result.judul}
                      onChange={(e) => handleFieldChange('judul', e.target.value)}
                    />
                  </div>

                  {/* Ringkasan */}
                  <div className="rca-field-group">
                    <label className="rca-field-label">
                      <div className="field-indicator orange" />
                      Ringkasan Masalah
                    </label>
                    <textarea
                      className="rca-field-input"
                      value={result.ringkasan}
                      onChange={(e) => handleFieldChange('ringkasan', e.target.value)}
                    />
                  </div>

                  {/* Root Cause */}
                  <div className="rca-field-group">
                    <label className="rca-field-label">
                      <div className="field-indicator red" />
                      Root Cause (Akar Masalah)
                    </label>
                    <textarea
                      className="rca-field-input"
                      value={result.root_cause}
                      onChange={(e) => handleFieldChange('root_cause', e.target.value)}
                    />
                  </div>

                  {/* Daftar Penyebab */}
                  <div className="rca-field-group">
                    <label className="rca-field-label">
                      <div className="field-indicator blue" />
                      Faktor-Faktor Penyebab
                    </label>
                    <div className="rca-list-field">
                      {result.penyebab.map((p, idx) => (
                        <div key={idx} className="rca-list-item">
                          <input
                            type="text"
                            value={p}
                            onChange={(e) => handleArrayChange('penyebab', idx, e.target.value)}
                          />
                          <button
                            className="rca-remove-btn"
                            onClick={() => removeArrayItem('penyebab', idx)}
                            title="Hapus"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                      <button className="rca-add-btn" onClick={() => addArrayItem('penyebab')}>
                        <Plus size={14} /> Tambah Penyebab
                      </button>
                    </div>
                  </div>

                  {/* Daftar Tindakan */}
                  <div className="rca-field-group">
                    <label className="rca-field-label">
                      <div className="field-indicator green" />
                      Tindakan Penyelesaian
                    </label>
                    <div className="rca-list-field">
                      {result.tindakan.map((t, idx) => (
                        <div key={idx} className="rca-list-item">
                          <div className="rca-checkbox-wrapper">
                            <input
                              type="checkbox"
                              className="rca-checkbox"
                              checked={t.done}
                              onChange={() => handleTindakanToggle(idx)}
                            />
                          </div>
                          <input
                            type="text"
                            className={t.done ? 'done-text' : ''}
                            value={t.text}
                            onChange={(e) => handleTindakanTextChange(idx, e.target.value)}
                          />
                          <button
                            className="rca-remove-btn"
                            onClick={() => removeArrayItem('tindakan', idx)}
                            title="Hapus"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                      <button
                        className="rca-add-btn"
                        onClick={() => addArrayItem('tindakan', { text: '', done: false })}
                      >
                        <Plus size={14} /> Tambah Tindakan
                      </button>
                    </div>
                  </div>

                  {/* Fitur 3: Panel Rekomendasi AI */}
                  {result.rekomendasi && result.rekomendasi.length > 0 && (
                    <div className="rca-rekomendasi-panel">
                      <div className="rca-rekomendasi-header">
                        <Lightbulb size={15} />
                        <span>Rekomendasi AI</span>
                      </div>
                      <div className="rca-rekomendasi-list">
                        {result.rekomendasi.map((rek, idx) => (
                          <div key={idx} className="rca-rekomendasi-item">
                            <div className="rca-rekomendasi-content">
                              <span className={`rca-sumber-badge ${rek.sumber === 'internal' ? 'internal' : 'industri'}`}>
                                {rek.sumber === 'internal' ? 'Internal' : 'Industri'}
                              </span>
                              <p className="rca-rekomendasi-text">{rek.isi}</p>
                            </div>
                            <div className="rca-rekomendasi-actions">
                              <button
                                className="rca-rek-btn"
                                title="Salin teks rekomendasi"
                                onClick={() => {
                                  navigator.clipboard.writeText(rek.isi)
                                    .then(() => toast.success('Rekomendasi disalin.'))
                                    .catch(() => toast.error('Gagal menyalin.'));
                                }}
                              >
                                <Copy size={13} />
                              </button>
                              <button
                                className="rca-rek-btn add"
                                title="Tambahkan ke Tindakan"
                                onClick={() => addRekomendasiAsTindakan(rek.isi)}
                              >
                                <Plus size={13} /> Tindakan
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tombol Aksi */}
                  <div className="rca-actions">
                    <button className="rca-btn rca-btn-save" onClick={handleSaveReport}>
                      <Save size={14} />
                      Simpan Laporan
                    </button>
                    <button className="rca-btn rca-btn-copy" onClick={handleCopyToClipboard}>
                      <Clipboard size={14} />
                      Salin Teks
                    </button>
                    <button className="rca-btn rca-btn-new" onClick={handleReset}>
                      <RefreshCw size={14} />
                      Buat Baru
                    </button>
                  </div>

                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
