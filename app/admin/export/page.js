'use client';
import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { useIncidents } from '@/lib/incidents';
import { formatDate, formatDowntime } from '@/lib/utils';
import * as XLSX from 'xlsx';
import {
  Download, FileSpreadsheet, Filter, Calendar, CheckSquare,
  Square, AlertTriangle, Loader
} from 'lucide-react';
import toast from 'react-hot-toast';

const EXPORT_COLUMNS = [
  { key: 'id', label: 'ID', default: true },
  { key: 'problem_date', label: 'Problem Date', default: true },
  { key: 'jam_incident', label: 'Jam Incident', default: true },
  { key: 'aplikasi', label: 'Aplikasi', default: true },
  { key: 'aplikasi_terimpact', label: 'Aplikasi Terimpact', default: true },
  { key: 'lama_downtime', label: 'Lama Downtime (menit)', default: true },
  { key: 'severity', label: 'Severity', default: true },
  { key: 'nama_platform', label: 'Nama Platform', default: true },
  { key: 'detail_problem', label: 'Detail Problem', default: true },
  { key: 'root_cause', label: 'Root Cause', default: true },
  { key: 'action_plan', label: 'Action Plan', default: true },
  { key: 'target_action_plan', label: 'Target Action Plan', default: true },
  { key: 'status_action_plan', label: 'Status Action Plan', default: true },
  { key: 'nama_sme', label: 'Nama SME', default: true },
  { key: 'nama_department', label: 'Nama Department', default: true },
  { key: 'workflow_status', label: 'Workflow Status', default: false },
  { key: 'created_at', label: 'Created At', default: false },
  { key: 'updated_at', label: 'Updated At', default: false },
];

export default function ExportPage() {
  const { user, hasRole } = useAuth();
  const { incidents } = useIncidents();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sevFilter, setSevFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCols, setSelectedCols] = useState(
    EXPORT_COLUMNS.filter(c => c.default).map(c => c.key)
  );
  const [exporting, setExporting] = useState(false);

  if (!hasRole('checker', 'superadmin')) {
    return (
      <div className="empty-state" style={{ marginTop: 80 }}>
        <AlertTriangle size={48} />
        <h3>Akses Ditolak</h3>
        <p>Hanya Checker dan Superadmin yang dapat mengakses halaman ini.</p>
      </div>
    );
  }

  const filtered = useMemo(() => {
    let list = [...incidents];

    // Checker only sees approved + own dept
    if (user.role === 'checker') {
      list = list.filter(i => i.workflow_status === 'Approved');
    }

    if (dateFrom) list = list.filter(i => i.problem_date >= dateFrom);
    if (dateTo) list = list.filter(i => i.problem_date <= dateTo);
    if (sevFilter) list = list.filter(i => i.severity === sevFilter);
    if (statusFilter) list = list.filter(i => i.status_action_plan === statusFilter);

    return list.sort((a, b) => new Date(b.problem_date) - new Date(a.problem_date));
  }, [incidents, user, dateFrom, dateTo, sevFilter, statusFilter]);

  const toggleCol = (key) => {
    setSelectedCols(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const selectAllCols = () => setSelectedCols(EXPORT_COLUMNS.map(c => c.key));
  const deselectAllCols = () => setSelectedCols(['id']);

  const handleExport = async () => {
    if (selectedCols.length === 0) {
      toast.error('Pilih minimal 1 kolom');
      return;
    }
    if (filtered.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    setExporting(true);
    const startTime = performance.now();

    // Small delay for UX
    await new Promise(r => setTimeout(r, 300));

    try {
      const headers = selectedCols.map(k => EXPORT_COLUMNS.find(c => c.key === k)?.label || k);
      const rows = filtered.map(inc => {
        return selectedCols.map(key => {
          if (key === 'aplikasi_terimpact') return (inc[key] || []).join(', ');
          if (key === 'problem_date' || key === 'target_action_plan') return formatDate(inc[key]);
          if (key === 'created_at' || key === 'updated_at') return new Date(inc[key]).toLocaleString('id-ID');
          return inc[key] ?? '';
        });
      });

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

      // Style column widths
      ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length, 15) }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Incidents');
      const filename = `Incidents_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);

      const elapsed = Math.round(performance.now() - startTime);
      toast.success(`✅ Exported ${filtered.length} rows in ${elapsed}ms — ${filename}`);
    } catch (err) {
      toast.error('Export gagal: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <h2>Export Center</h2>
        <p>Ekspor data insiden ke format Excel (.xlsx)</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Left: Filters */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><Filter size={14} style={{ marginRight: 6 }} /> Filter Data</h3>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Dari Tanggal</label>
              <input type="date" className="form-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Sampai Tanggal</label>
              <input type="date" className="form-input" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Severity</label>
              <select className="form-select" value={sevFilter} onChange={e => setSevFilter(e.target.value)}>
                <option value="">Semua</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">Semua</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <div style={{
            padding: '12px 16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)', marginTop: 8, textAlign: 'center',
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--primary-light)' }}>
              {filtered.length}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>rows akan diekspor</div>
          </div>
        </div>

        {/* Right: Column Selector */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><FileSpreadsheet size={14} style={{ marginRight: 6 }} /> Pilih Kolom</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={selectAllCols} style={{ fontSize: '0.72rem' }}>Semua</button>
              <button className="btn btn-ghost btn-sm" onClick={deselectAllCols} style={{ fontSize: '0.72rem' }}>Reset</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {EXPORT_COLUMNS.map(col => (
              <label
                key={col.key}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.82rem',
                  background: selectedCols.includes(col.key) ? 'rgba(108, 92, 231, 0.08)' : 'transparent',
                  transition: 'background 0.15s',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedCols.includes(col.key)}
                  onChange={() => toggleCol(col.key)}
                  style={{ accentColor: 'var(--primary)', width: 16, height: 16 }}
                />
                {col.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <button
          className="btn btn-primary"
          onClick={handleExport}
          disabled={exporting || filtered.length === 0}
          style={{ padding: '14px 40px', fontSize: '1rem' }}
          id="btn-export"
        >
          {exporting ? (
            <>
              <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
              Mengekspor...
            </>
          ) : (
            <>
              <Download size={18} />
              Export ke Excel ({filtered.length} rows)
            </>
          )}
        </button>
      </div>
    </div>
  );
}
