'use client';

import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import {
  Mic, MicOff, Sparkles, Save, Clipboard, RefreshCw, Trash2, Plus, X, ListTodo, History, AlertTriangle, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import './rca.css';

export default function RCALaporanPage() {
  // Transkrip & State Perekaman
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState('id');
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const recognitionRef = useRef(null);

  // Status & Hasil Analisis AI
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // Riwayat Laporan
  const [history, setHistory] = useState([]);
  const [activeReportId, setActiveReportId] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

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
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
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
    };

    recognitionRef.current = rec;
  }, [language]);

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

  // Muat riwayat laporan saat inisialisasi
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch('/api/rca/reports');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Gagal mengambil riwayat:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Analisis otomatis dengan AI
  const handleAnalyze = async () => {
    if (!transcript.trim()) {
      toast.error('Silakan isi transkrip atau rekam suara terlebih dahulu.');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const res = await fetch('/api/rca/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, language }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Gagal menganalisis data');
      }

      const data = await res.json();
      setResult(data);
      toast.success('Analisis selesai!');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat menganalisis transkrip.');
      toast.error('Gagal menganalisis transkrip.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Penanganan Edit Hasil RCA secara Manual
  const handleFieldChange = (field, value) => {
    setResult(prev => ({
      ...prev,
      [field]: value
    }));
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

  // Simpan Laporan ke Database
  const handleSaveReport = async () => {
    if (!result) return;

    const payload = {
      ...result,
      id: activeReportId || undefined,
      transcript,
      language,
    };

    const loadingToast = toast.loading('Menyimpan laporan...');

    try {
      const res = await fetch('/api/rca/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Gagal menyimpan laporan');
      }

      const savedReport = await res.json();
      toast.success('Laporan berhasil disimpan!', { id: loadingToast });
      
      // Update local state
      setActiveReportId(savedReport.id);
      fetchHistory();
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan laporan.', { id: loadingToast });
    }
  };

  // Hapus Laporan
  const handleDeleteReport = async (id, e) => {
    if (e) e.stopPropagation();

    if (!confirm('Apakah Anda yakin ingin menghapus laporan ini?')) return;

    const loadingToast = toast.loading('Menghapus laporan...');

    try {
      const res = await fetch(`/api/rca/reports/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Gagal menghapus laporan');
      }

      toast.success('Laporan berhasil dihapus!', { id: loadingToast });
      
      if (activeReportId === id) {
        handleReset();
      }
      
      fetchHistory();
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghapus laporan.', { id: loadingToast });
    }
  };

  // Membuka laporan lama dari riwayat
  const handleLoadReport = (report) => {
    setTranscript(report.transcript || '');
    setLanguage(report.language || 'id');
    setActiveReportId(report.id);
    setResult({
      judul: report.judul || '',
      ringkasan: report.ringkasan || '',
      root_cause: report.root_cause || '',
      penyebab: report.penyebab || [],
      tindakan: report.tindakan || [],
    });
    setError('');
    toast.success('Laporan dimuat.');
  };

  // Reset Form untuk membuat baru
  const handleReset = () => {
    setTranscript('');
    setResult(null);
    setActiveReportId(null);
    setError('');
    toast.success('Form telah direset.');
  };

  // Salin Teks Format WhatsApp/Email
  const handleCopyToClipboard = () => {
    if (!result) return;

    const template = `*LAPORAN ROOT CAUSE ANALYSIS (RCA)*

*Judul:* ${result.judul || '-'}
*Ringkasan:* ${result.ringkasan || '-'}

*Akar Masalah (Root Cause):*
${result.root_cause || '-'}

*Faktor Penyebab:*
${result.penyebab.length > 0 ? result.penyebab.map((p, i) => `${i + 1}. ${p}`).join('\n') : '-'}

*Tindakan Penyelesaian:*
${result.tindakan.length > 0 ? result.tindakan.map((t, i) => `${t.done ? '[x]' : '[ ]'} ${t.text}`).join('\n') : '-'}

_Dibuat otomatis via Laporan Suara RCA_`;

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
                Laporan Suara RCA
              </h2>
              <p>Dokumentasikan insiden & buat Root Cause Analysis langsung dengan suara</p>
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
                  <span>Transkrip Teks (Bisa Diedit):</span>
                  <span className="rca-transcript-count">{transcript.length} karakter</span>
                </div>
                <textarea
                  className="rca-transcript"
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Hasil suara Anda akan ditranskripsikan langsung di sini... Atau ketik laporan Anda secara manual jika diinginkan."
                />
              </div>

              {/* Tombol Analisis AI */}
              <button
                className="rca-analyze-btn"
                onClick={handleAnalyze}
                disabled={isAnalyzing || !transcript.trim()}
              >
                {isAnalyzing ? (
                  <>
                    <div className="spinner" />
                    Menganalisis dengan Gemini AI...
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

          {/* Panel Kanan: Hasil Analisis & Riwayat */}
          <div className="rca-panel">
            
            {/* Hasil Analisis RCA */}
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
                  <p>Mulai dengan merekam suara atau ketik laporan Anda lalu klik tombol "Analisis dengan AI".</p>
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
                      <button
                        className="rca-add-btn"
                        onClick={() => addArrayItem('penyebab')}
                      >
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

            {/* Riwayat Laporan */}
            <div className="rca-history-card">
              <div className="card-label">
                <History size={14} />
                Riwayat Laporan RCA
              </div>

              {isLoadingHistory ? (
                <div className="rca-history-empty">Memuat riwayat...</div>
              ) : history.length === 0 ? (
                <div className="rca-history-empty">Belum ada laporan tersimpan</div>
              ) : (
                <div className="rca-history-list">
                  {history.map((h) => (
                    <button
                      key={h.id}
                      className={`rca-history-item ${activeReportId === h.id ? 'active' : ''}`}
                      onClick={() => handleLoadReport(h)}
                    >
                      <div className="rca-history-info">
                        <div className="rca-history-title">{h.judul}</div>
                        <div className="rca-history-date">
                          {new Date(h.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <button
                        className="rca-history-delete"
                        onClick={(e) => handleDeleteReport(h.id, e)}
                        title="Hapus Laporan"
                      >
                        <Trash2 size={14} />
                      </button>
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
