'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useIncidents } from '@/lib/incidents';
import {
  MessageSquare, Plus, Trash2, Play, Pause, Send, Clock,
  AlertTriangle, Save, X, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const CRON_PRESETS = [
  { label: 'Setiap hari jam 08:00', cron: '0 8 * * *', desc: 'Pengingat pagi' },
  { label: 'Setiap hari jam 17:00', cron: '0 17 * * *', desc: 'Pengingat sore' },
  { label: 'Setiap hari jam 08:00 & 17:00', cron: '0 8,17 * * *', desc: 'Pagi & sore' },
  { label: 'Senin-Jumat jam 09:00', cron: '0 9 * * 1-5', desc: 'Weekday pagi' },
  { label: 'Setiap 4 jam', cron: '0 */4 * * *', desc: 'Periodik 4 jam' },
  { label: 'Custom', cron: '', desc: 'Atur manual' },
];

const TEMPLATE_VARS = [
  { var: '{{date}}', desc: 'Tanggal hari ini' },
  { var: '{{time}}', desc: 'Waktu saat ini' },
  { var: '{{pending_count}}', desc: 'Jumlah incident pending review' },
  { var: '{{open_count}}', desc: 'Jumlah incident open' },
  { var: '{{high_count}}', desc: 'Jumlah incident high severity' },
];

export default function WASchedulerPage() {
  const { user, hasRole } = useAuth();
  const { waSchedules, incidents, saveWaSchedule, deleteWaSchedule } = useIncidents();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    template: '🔔 *Reminder IT Operations*\n\nTanggal: {{date}}\nWaktu: {{time}}\n\n📋 Pending Review: {{pending_count}} incident\n🔴 High Severity Open: {{high_count}} incident\n⚠️ Total Open: {{open_count}} incident\n\nMohon segera lengkapi laporan incident yang belum disubmit. Terima kasih! 🙏',
    cron_expression: '0 8,17 * * *',
    target_group: '',
    fonnte_token: '',
    is_active: true,
  });
  const [selectedPreset, setSelectedPreset] = useState(2);

  if (!hasRole('superadmin')) {
    return (
      <div className="empty-state" style={{ marginTop: 80 }}>
        <AlertTriangle size={48} />
        <h3>Akses Ditolak</h3>
        <p>Hanya Superadmin yang dapat mengakses halaman ini.</p>
      </div>
    );
  }

  const openForm = (schedule = null) => {
    if (schedule) {
      setEditItem(schedule);
      setForm({
        template: schedule.template,
        cron_expression: schedule.cron_expression,
        target_group: schedule.target_group,
        is_active: schedule.is_active,
      });
    } else {
      setEditItem(null);
      setForm({
        template: '🔔 *Reminder IT Operations*\n\nTanggal: {{date}}\nWaktu: {{time}}\n\n📋 Pending Review: {{pending_count}} incident\n🔴 High Severity Open: {{high_count}} incident\n⚠️ Total Open: {{open_count}} incident\n\nMohon segera lengkapi laporan incident yang belum disubmit. Terima kasih! 🙏',
        cron_expression: '0 8,17 * * *',
        target_group: '',
        fonnte_token: '',
        is_active: true,
      });
    }
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.template.trim()) { toast.error('Template pesan wajib diisi'); return; }
    if (!form.cron_expression.trim()) { toast.error('Jadwal cron wajib diisi'); return; }
    if (!form.target_group.trim()) { toast.error('Target grup WhatsApp wajib diisi'); return; }
    if (!form.fonnte_token.trim()) { toast.error('Token Fonnte wajib diisi'); return; }

    const schedule = editItem ? { ...editItem, ...form } : { ...form, created_by: user.id };
    saveWaSchedule(schedule);
    toast.success(editItem ? 'Schedule diperbarui' : 'Schedule baru dibuat');
    setShowForm(false);
  };

  const handleDelete = (id) => {
    if (confirm('Yakin ingin menghapus schedule ini?')) {
      deleteWaSchedule(id);
      toast.success('Schedule dihapus');
    }
  };

  const handleTestSend = async () => {
    if (!form.target_group.trim()) { toast.error('Target grup WhatsApp wajib diisi'); return; }
    if (!form.fonnte_token.trim()) { toast.error('Token Fonnte wajib diisi'); return; }

    const pendingCount = incidents.filter(i => i.workflow_status === 'Pending Review').length;
    const openCount = incidents.filter(i => i.status_action_plan === 'Open').length;
    const highCount = incidents.filter(i => i.severity === 'High' && i.status_action_plan !== 'Closed').length;

    let preview = form.template
      .replace(/\{\{date\}\}/g, new Date().toLocaleDateString('id-ID'))
      .replace(/\{\{time\}\}/g, new Date().toLocaleTimeString('id-ID'))
      .replace(/\{\{pending_count\}\}/g, pendingCount)
      .replace(/\{\{open_count\}\}/g, openCount)
      .replace(/\{\{high_count\}\}/g, highCount);

    const tId = toast.loading('Mengirim pesan via Fonnte...');
    try {
      const res = await fetch('/api/fonnte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: form.target_group,
          message: preview,
          token: form.fonnte_token
        })
      });
      const data = await res.json();
      if (!res.ok || (data.error && !data.success)) {
        throw new Error(data.error || 'Gagal tersambung ke Fonnte');
      }
      toast.success('Pesan WhatsApp terkirim ke target!', { id: tId });
      console.log('=== Fonnte Response ===', data);
    } catch (error) {
      toast.error(`Gagal: ${error.message}`, { id: tId });
    }
  };

  const previewMessage = () => {
    const pendingCount = incidents.filter(i => i.workflow_status === 'Pending Review').length;
    const openCount = incidents.filter(i => i.status_action_plan === 'Open').length;
    const highCount = incidents.filter(i => i.severity === 'High' && i.status_action_plan !== 'Closed').length;

    return form.template
      .replace(/\{\{date\}\}/g, new Date().toLocaleDateString('id-ID'))
      .replace(/\{\{time\}\}/g, new Date().toLocaleTimeString('id-ID'))
      .replace(/\{\{pending_count\}\}/g, pendingCount)
      .replace(/\{\{open_count\}\}/g, openCount)
      .replace(/\{\{high_count\}\}/g, highCount);
  };

  return (
    <div className="animate-fade">
      <div className="page-header page-header-actions">
        <div>
          <h2>WhatsApp Scheduler</h2>
          <p>Konfigurasi reminder otomatis ke WhatsApp Group</p>
        </div>
        <button className="btn btn-primary" onClick={() => openForm()}>
          <Plus size={16} /> Buat Schedule
        </button>
      </div>

      {/* Existing Schedules */}
      {waSchedules.length === 0 && !showForm ? (
        <div className="empty-state">
          <MessageSquare size={48} />
          <h3>Belum ada schedule</h3>
          <p>Buat schedule baru untuk mengirim reminder otomatis ke WhatsApp Group</p>
          <button className="btn btn-primary mt-md" onClick={() => openForm()}>
            <Plus size={16} /> Buat Schedule
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
          {waSchedules.map(s => (
            <div key={s.id} className={`wa-card ${s.is_active ? 'active' : ''}`}>
              <div className="flex-between" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`wa-status-dot ${s.is_active ? 'active' : 'inactive'}`} />
                  <span style={{ fontWeight: 600 }}>{s.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => openForm(s)}>Edit</button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(s.id)} title="Hapus">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.85rem' }}>
                <div>
                  <span className="text-muted text-sm">Cron:</span>
                  <div className="text-mono">{s.cron_expression}</div>
                </div>
                <div>
                  <span className="text-muted text-sm">Target Group:</span>
                  <div>{s.target_group}</div>
                </div>
              </div>
              <div style={{ marginTop: 12, fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', background: 'var(--bg-card)', padding: 12, borderRadius: 8, maxHeight: 120, overflow: 'hidden' }}>
                {s.template}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Form */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editItem ? 'Edit Schedule' : 'Buat Schedule Baru'}</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {/* Template */}
              <div className="form-group">
                <label className="form-label">Template Pesan <span className="required">*</span></label>
                <textarea
                  className="form-textarea"
                  rows={6}
                  value={form.template}
                  onChange={e => setForm(prev => ({ ...prev, template: e.target.value }))}
                />
                <div className="form-hint">
                  Variabel tersedia: {TEMPLATE_VARS.map(v => (
                    <code key={v.var} style={{
                      background: 'var(--bg-card)', padding: '1px 6px', borderRadius: 4,
                      fontSize: '0.72rem', marginRight: 6, cursor: 'pointer',
                      color: 'var(--primary-light)',
                    }}
                    onClick={() => setForm(prev => ({ ...prev, template: prev.template + ` ${v.var}` }))}
                    title={v.desc}
                    >{v.var}</code>
                  ))}
                </div>
              </div>

              {/* Cron Schedule */}
              <div className="form-group">
                <label className="form-label">Jadwal Pengiriman <span className="required">*</span></label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {CRON_PRESETS.map((p, i) => (
                    <button
                      key={i}
                      className={`btn btn-sm ${selectedPreset === i ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => { setSelectedPreset(i); if (p.cron) setForm(prev => ({ ...prev, cron_expression: p.cron })); }}
                      style={{ fontSize: '0.75rem' }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  className="form-input text-mono"
                  placeholder="cth: 0 8,17 * * *"
                  value={form.cron_expression}
                  onChange={e => { setForm(prev => ({ ...prev, cron_expression: e.target.value })); setSelectedPreset(5); }}
                />
              </div>

              {/* Target Group */}
              <div className="form-group">
                <label className="form-label">Target WhatsApp (Nomor/Group) <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="cth: 08123456789 atau ID Group Fonnte"
                  value={form.target_group}
                  onChange={e => setForm(prev => ({ ...prev, target_group: e.target.value }))}
                />
              </div>

              {/* Fonnte API Token */}
              <div className="form-group">
                <label className="form-label">Fonnte API Token <span className="required">*</span></label>
                <input
                  type="password"
                  className="form-input text-mono"
                  placeholder="Masukkan Token Fonnte..."
                  value={form.fonnte_token}
                  onChange={e => setForm(prev => ({ ...prev, fonnte_token: e.target.value }))}
                />
                <div className="form-hint">Token dibutuhkan untuk autentikasi API pengiriman. Dapat dilihat di Dashboard Fonnte.</div>
              </div>

              {/* Active toggle */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                  />
                  Schedule aktif
                </label>
              </div>

              {/* Preview */}
              <div className="form-group">
                <label className="form-label">Preview Pesan</label>
                <div style={{
                  background: '#1A3A2A', border: '1px solid rgba(29, 209, 161, 0.2)',
                  borderRadius: 'var(--radius-md)', padding: 14, fontSize: '0.82rem',
                  whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#EAEAFF',
                }}>
                  {previewMessage()}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={handleTestSend}>
                <Send size={14} /> Test Send
              </button>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSave}>
                <Save size={14} /> {editItem ? 'Perbarui' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
