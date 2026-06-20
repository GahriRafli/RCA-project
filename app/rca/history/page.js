'use client';

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import {
  Search, Trash2, Edit3, Save, RefreshCw, AlertTriangle, CalendarDays, X, Plus, History, Clipboard
} from 'lucide-react';
import toast from 'react-hot-toast';
import '../../rca/rca.css';

export default function RCAHistoryPage() {
  // No auth: app uses reporter name & NIP provided in reports themselves
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterNip, setFilterNip] = useState('');
  const [filterTitle, setFilterTitle] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/rca/reports');
      if (!res.ok) throw new Error('Gagal memuat riwayat laporan');
      const data = await res.json();
      setReports(data);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Gagal memuat riwayat laporan.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const createdAt = new Date(report.created_at);
      const matchesFrom = filterDateFrom ? createdAt >= new Date(`${filterDateFrom}T00:00:00`) : true;
      const matchesTo = filterDateTo ? createdAt <= new Date(`${filterDateTo}T23:59:59`) : true;
      const matchesName = filterName ? report.name?.toLowerCase().includes(filterName.toLowerCase()) : true;
      const matchesNip = filterNip ? report.nip?.includes(filterNip) : true;
      const matchesTitle = filterTitle ? report.judul?.toLowerCase().includes(filterTitle.toLowerCase()) : true;
      return matchesFrom && matchesTo && matchesName && matchesNip && matchesTitle;
    });
  }, [reports, filterDateFrom, filterDateTo, filterName, filterNip, filterTitle]);

  const selectReport = (report) => {
    setSelectedReport(normalizeReport(report));
  };

  const normalizeReport = (report) => ({
    ...report,
    penyebab: Array.isArray(report.penyebab) ? report.penyebab : [],
    tindakan: Array.isArray(report.tindakan)
      ? report.tindakan.map((item) =>
          typeof item === 'string'
            ? { text: item, done: false }
            : {
                text: item?.text ?? item ?? '',
                done: Boolean(item?.done),
              }
        )
      : [],
  });
  const updateSelected = (field, value) => {
    setSelectedReport((prev) => ({ ...prev, [field]: value }));
  };

  const updateArrayField = (field, index, value) => {
    setSelectedReport((prev) => {
      const updated = [...(prev[field] || [])];
      updated[index] = value;
      return { ...prev, [field]: updated };
    });
  };
  const toggleTindakan = (index) => {
    setSelectedReport((prev) => {
      const updated = [...(prev.tindakan || [])];
      updated[index] = { ...updated[index], done: !updated[index]?.done };
      return { ...prev, tindakan: updated };
    });
  };

  const addArrayItem = (field, defaultValue) => {
    setSelectedReport((prev) => ({
      ...prev,
      [field]: [...(prev[field] || []), defaultValue],
    }));
  };

  const removeArrayItem = (field, index) => {
    setSelectedReport((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (!selectedReport) return;
    if (!selectedReport.name?.trim() || !selectedReport.nip?.trim()) {
      toast.error('Nama dan NIP requestor harus diisi.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/rca/reports/${selectedReport.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...selectedReport,
          updated_by_user_id: null,
          updated_by_user_name: null,
          updated_by_role: null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal memperbarui laporan');
      }
      const updated = await res.json();
      setReports((prev) => prev.map((report) => (report.id === updated.id ? updated : report)));
      setSelectedReport(normalizeReport(updated));
      toast.success('Laporan berhasil diperbarui');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Gagal memperbarui laporan.');
    } finally {
      setIsSaving(false);
    }
  };


  const copySelectedReportText = async () => {
    if (!selectedReport) return;

    const template = `*LAPORAN RCA*

Nama Pelapor: ${selectedReport.name || '-'}
NIP Pelapor: ${selectedReport.nip || '-'}
Judul: ${selectedReport.judul || '-'}
Ringkasan: ${selectedReport.ringkasan || '-'}
Root Cause: ${selectedReport.root_cause || '-'}

Faktor Penyebab:
${(selectedReport.penyebab || []).map((p, i) => `${i + 1}. ${p}`).join('\n') || '-'}

Tindakan:
${(selectedReport.tindakan || []).map((t, i) => `${i + 1}. ${t.done ? '[x]' : '[ ]'} ${t.text}`).join('\n') || '-'}
`;

    try {
      await navigator.clipboard.writeText(template);
      toast.success('Teks laporan berhasil disalin.');
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyalin teks.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus laporan ini secara permanen?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/rca/reports/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menghapus laporan');
      }
      setReports((prev) => prev.filter((report) => report.id !== id));
      if (selectedReport?.id === id) setSelectedReport(null);
      toast.success('Laporan berhasil dihapus');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Gagal menghapus laporan.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="rca-container">
          <div className="rca-page-header">
            <div>
              <h2>
                <div className="header-icon">
                  <CalendarDays size={18} />
                </div>
                Riwayat Laporan RCA
              </h2>
              <p>Filter dan kelola laporan RCA Anda di halaman ini.</p>
            </div>
          </div>

          <div className="rca-history-grid">
            <div className="rca-history-card">
              <div className="card-label">
                <Search size={14} />
                Filter Laporan
              </div>
              <div className="rca-history-filters">
                <div className="rca-field-group">
                  <label className="rca-field-label">Dari Tanggal</label>
                  <input type="date" className="rca-field-input" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
                </div>
                <div className="rca-field-group">
                  <label className="rca-field-label">Sampai Tanggal</label>
                  <input type="date" className="rca-field-input" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} />
                </div>
                <div className="rca-field-group">
                  <label className="rca-field-label">Nama Pelapor</label>
                  <input type="text" className="rca-field-input" placeholder="Cari nama" value={filterName} onChange={(e) => setFilterName(e.target.value)} />
                </div>
                <div className="rca-field-group">
                  <label className="rca-field-label">NIP Pelapor</label>
                  <input type="text" className="rca-field-input" placeholder="Cari NIP" value={filterNip} onChange={(e) => setFilterNip(e.target.value)} />
                </div>
                <div className="rca-field-group">
                  <label className="rca-field-label">Judul Laporan</label>
                  <input type="text" className="rca-field-input" placeholder="Judul mengandung..." value={filterTitle} onChange={(e) => setFilterTitle(e.target.value)} />
                </div>
                <button className="rca-btn rca-btn-refresh" type="button" onClick={fetchReports}>
                  <RefreshCw size={14} /> Muat Ulang
                </button>
              </div>
            </div>

            <div className="rca-history-card">
              <div className="card-label">
                <History size={14} />
                Daftar Laporan
              </div>
              <div className="rca-history-list">
                {isLoading ? (
                  <div className="rca-history-empty">Memuat laporan...</div>
                ) : filteredReports.length === 0 ? (
                  <div className="rca-history-empty">Tidak ada laporan sesuai filter.</div>
                ) : (
                  <div className="rca-history-table-wrapper">
                    <table className="rca-history-table">
                      <thead>
                        <tr>
                          <th>Tanggal</th>
                          <th>Nama</th>
                          <th>NIP</th>
                          <th>Judul</th>
                          <th>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReports.map((report) => (
                          <tr key={report.id} className={selectedReport?.id === report.id ? 'active-row' : ''}>
                            <td>{new Date(report.created_at).toLocaleDateString('id-ID')}</td>
                            <td>{report.name}</td>
                            <td>{report.nip}</td>
                            <td>{report.judul}</td>
                            <td className="history-action-cell">
                              <button className="rca-btn rca-btn-copy" type="button" onClick={() => selectReport(report)}>
                                <Edit3 size={14} /> Pilih
                              </button>
                              <button className="rca-btn rca-btn-new" type="button" onClick={() => handleDelete(report.id)} disabled={deletingId === report.id}>
                                <Trash2 size={14} /> Hapus
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="rca-history-card rca-history-detail-card">
              <div className="card-label">
                <Edit3 size={14} /> Detail Laporan
              </div>
              {selectedReport ? (
                <div className="rca-history-detail">
                  <div className="rca-field-group">
                    <label className="rca-field-label">Nama Requestor</label>
                    <input type="text" className="rca-field-input" value={selectedReport.name} onChange={(e) => updateSelected('name', e.target.value)} />
                  </div>
                  <div className="rca-field-group">
                    <label className="rca-field-label">NIP Requestor</label>
                    <input type="text" className="rca-field-input" value={selectedReport.nip} onChange={(e) => updateSelected('nip', e.target.value.replace(/\D/g, ''))} />
                  </div>
                  <div className="rca-field-group">
                    <label className="rca-field-label">Judul Laporan</label>
                    <input type="text" className="rca-field-input" value={selectedReport.judul} onChange={(e) => updateSelected('judul', e.target.value)} />
                  </div>
                  <div className="rca-field-group">
                    <label className="rca-field-label">Ringkasan</label>
                    <textarea className="rca-field-input" value={selectedReport.ringkasan} onChange={(e) => updateSelected('ringkasan', e.target.value)} />
                  </div>
                  <div className="rca-field-group">
                    <label className="rca-field-label">Root Cause</label>
                    <textarea className="rca-field-input" value={selectedReport.root_cause} onChange={(e) => updateSelected('root_cause', e.target.value)} />
                  </div>
                  <div className="rca-field-group">
                    <label className="rca-field-label">Faktor Penyebab</label>
                    <div className="rca-list-field">
                      {(selectedReport.penyebab || []).map((item, idx) => (
                        <div key={idx} className="rca-list-item">
                          <input type="text" value={item} onChange={(e) => updateArrayField('penyebab', idx, e.target.value)} />
                          <button className="rca-remove-btn" onClick={() => removeArrayItem('penyebab', idx)} title="Hapus">
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                      <button className="rca-add-btn" onClick={() => addArrayItem('penyebab', '')}>
                        <Plus size={14} /> Tambah Penyebab
                      </button>
                    </div>
                  </div>
                  <div className="rca-field-group">
                    <label className="rca-field-label">Tindakan</label>
                    <div className="rca-list-field">
                      {(selectedReport.tindakan || []).map((item, idx) => (
                        <div key={idx} className={`rca-list-item ${item.done ? 'done-action-item' : ''}`}>
                          <button
                            type="button"
                            className="rca-checkbox-btn"
                            onClick={() => toggleTindakan(idx)}
                            aria-label={item.done ? 'Tandai belum selesai' : 'Tandai selesai'}
                          >
                            <input
                              type="checkbox"
                              className="rca-checkbox"
                              checked={item.done}
                              readOnly
                            />
                          </button>
                          <input
                            type="text"
                            className={item.done ? 'done-text' : ''}
                            value={item.text}
                            onChange={(e) => updateArrayField('tindakan', idx, { ...item, text: e.target.value })}
                          />
                          <button className="rca-remove-btn" onClick={() => removeArrayItem('tindakan', idx)} title="Hapus">
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                      <button className="rca-add-btn" onClick={() => addArrayItem('tindakan', { text: '', done: false })}>
                        <Plus size={14} /> Tambah Tindakan
                      </button>
                    </div>
                  </div>
                  <div className="rca-actions">
                    <button className="rca-btn rca-btn-copy" type="button" onClick={copySelectedReportText}>
                      <Clipboard size={14} /> Salin Teks
                    </button>
                    <button className="rca-btn rca-btn-save" onClick={handleSave} disabled={isSaving}>
                      <Save size={14} /> Simpan Perubahan
                    </button>
                    <button className="rca-btn rca-btn-new" onClick={() => setSelectedReport(null)}>
                      <RefreshCw size={14} /> Batal
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rca-history-empty">
                  <AlertTriangle size={20} />
                  <p>Pilih laporan dari daftar untuk melihat atau mengedit.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
