'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useIncidents } from '@/lib/incidents';
import { SEVERITY_LEVELS, STATUS_OPTIONS } from '@/lib/constants';
import { Save, ArrowLeft, X, Plus, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewIncidentPage() {
  const { user } = useAuth();
  const { createIncident } = useIncidents();
  const router = useRouter();

  const [form, setForm] = useState({
    problem_date: new Date().toISOString().split('T')[0],
    jam_incident: '',
    aplikasi: '',
    aplikasi_terimpact: [],
    lama_downtime: '',
    severity: '',
    nama_platform: '',
    detail_problem: '',
    root_cause: '',
    action_plan: '',
    target_action_plan: '',
    status_action_plan: 'Open',
    nama_sme: '',
    nama_department: '',
  });

  const [errors, setErrors] = useState({});
  const [impactInput, setImpactInput] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const addImpactApp = () => {
    const val = impactInput.trim();
    if (val && !form.aplikasi_terimpact.includes(val)) {
      update('aplikasi_terimpact', [...form.aplikasi_terimpact, val]);
    }
    setImpactInput('');
  };

  const handleImpactKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addImpactApp();
    }
  };

  const removeImpactApp = (app) => {
    update('aplikasi_terimpact', form.aplikasi_terimpact.filter(a => a !== app));
  };

  const validate = () => {
    const errs = {};
    if (!form.problem_date) errs.problem_date = 'Wajib diisi';
    if (!form.jam_incident) errs.jam_incident = 'Wajib diisi';
    if (!form.aplikasi.trim()) errs.aplikasi = 'Wajib diisi';
    if (!form.lama_downtime || form.lama_downtime <= 0) errs.lama_downtime = 'Harus > 0';
    if (!form.severity) errs.severity = 'Wajib dipilih';
    if (!form.nama_platform.trim()) errs.nama_platform = 'Wajib diisi';
    if (!form.detail_problem || form.detail_problem.length < 20) errs.detail_problem = 'Minimal 20 karakter';
    if (!form.root_cause.trim()) errs.root_cause = 'Wajib diisi';
    if (!form.action_plan.trim()) errs.action_plan = 'Wajib diisi';
    if (!form.target_action_plan) errs.target_action_plan = 'Wajib diisi';
    if (!form.nama_sme.trim()) errs.nama_sme = 'Wajib diisi';
    if (!form.nama_department.trim()) errs.nama_department = 'Wajib diisi';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (submitForReview = false) => {
    if (!validate()) {
      toast.error('Mohon lengkapi semua field yang wajib diisi');
      return;
    }
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));

    const data = {
      ...form,
      lama_downtime: parseInt(form.lama_downtime),
    };

    const inc = createIncident(data, user.id, user.name);
    toast.success(`Incident ${inc.id} berhasil dibuat`);
    router.push('/incidents');
  };

  return (
    <div className="animate-fade">
      <div className="page-header page-header-actions">
        <div>
          <h2>Formulir Pencatatan Insiden</h2>
          <p>Lengkapi data berikut untuk mencatat insiden operasional IT</p>
        </div>
        <button className="btn btn-ghost" onClick={() => router.back()}>
          <ArrowLeft size={16} /> Kembali
        </button>
      </div>

      <div className="incident-form-container">
        {/* SECTION 1: Informasi Kejadian */}
        <div className="form-section">
          <div className="form-section-header">
            <div className="form-section-number">1</div>
            <div>
              <h3>Informasi Kejadian</h3>
              <p>Data waktu dan sistem yang terdampak</p>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tanggal Kejadian <span className="required">*</span></label>
              <input
                type="date"
                className={`form-input ${errors.problem_date ? 'input-error' : ''}`}
                value={form.problem_date}
                onChange={e => update('problem_date', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                id="field-problem-date"
              />
              {errors.problem_date && <div className="form-error">{errors.problem_date}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Jam Kejadian <span className="required">*</span></label>
              <input
                type="time"
                className={`form-input ${errors.jam_incident ? 'input-error' : ''}`}
                value={form.jam_incident}
                onChange={e => update('jam_incident', e.target.value)}
                id="field-jam-incident"
              />
              {errors.jam_incident && <div className="form-error">{errors.jam_incident}</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nama Aplikasi <span className="required">*</span></label>
              <input
                type="text"
                className={`form-input ${errors.aplikasi ? 'input-error' : ''}`}
                placeholder="Ketik nama aplikasi, cth: Payment Gateway"
                value={form.aplikasi}
                onChange={e => update('aplikasi', e.target.value)}
                id="field-aplikasi"
              />
              {errors.aplikasi && <div className="form-error">{errors.aplikasi}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Nama Platform <span className="required">*</span></label>
              <input
                type="text"
                className={`form-input ${errors.nama_platform ? 'input-error' : ''}`}
                placeholder="Ketik platform, cth: AWS, On-Premise DC1"
                value={form.nama_platform}
                onChange={e => update('nama_platform', e.target.value)}
                id="field-platform"
              />
              {errors.nama_platform && <div className="form-error">{errors.nama_platform}</div>}
            </div>
          </div>

          {/* Aplikasi Terimpact — free text with chips */}
          <div className="form-group">
            <label className="form-label">Aplikasi Terimpact</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                className="form-input"
                value={impactInput}
                onChange={e => setImpactInput(e.target.value)}
                onKeyDown={handleImpactKeyDown}
                placeholder="Ketik nama aplikasi, tekan Enter untuk menambah"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-ghost"
                onClick={addImpactApp}
                disabled={!impactInput.trim()}
                style={{ flexShrink: 0 }}
              >
                <Plus size={16} /> Tambah
              </button>
            </div>
            {form.aplikasi_terimpact.length > 0 && (
              <div className="chip-container">
                {form.aplikasi_terimpact.map(a => (
                  <div key={a} className="chip">
                    {a}
                    <button className="chip-remove" onClick={() => removeImpactApp(a)}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="form-hint">Tekan Enter atau klik Tambah untuk setiap aplikasi</div>
          </div>

          {/* Downtime & Severity */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Lama Downtime (menit) <span className="required">*</span></label>
              <input
                type="number"
                className={`form-input ${errors.lama_downtime ? 'input-error' : ''}`}
                placeholder="Durasi gangguan dalam menit"
                value={form.lama_downtime}
                onChange={e => update('lama_downtime', e.target.value)}
                min="1"
                id="field-downtime"
              />
              {errors.lama_downtime && <div className="form-error">{errors.lama_downtime}</div>}
              {form.lama_downtime > 0 && (
                <div className="form-hint">
                  ≈ {form.lama_downtime >= 60 ? `${Math.floor(form.lama_downtime / 60)} jam ${form.lama_downtime % 60} menit` : `${form.lama_downtime} menit`}
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Severity Level <span className="required">*</span></label>
              <div className="severity-selector">
                {SEVERITY_LEVELS.map(s => (
                  <label
                    key={s.value}
                    className={`severity-option ${form.severity === s.value ? 'selected' : ''}`}
                    style={{
                      '--sev-color': s.color,
                      borderColor: form.severity === s.value ? s.color : 'var(--border)',
                    }}
                  >
                    <input
                      type="radio"
                      name="severity"
                      value={s.value}
                      checked={form.severity === s.value}
                      onChange={e => update('severity', e.target.value)}
                      style={{ display: 'none' }}
                    />
                    <span className="severity-dot" style={{ background: s.color }} />
                    <span>
                      <strong>{s.label}</strong>
                      <small>{s.description}</small>
                    </span>
                  </label>
                ))}
              </div>
              {errors.severity && <div className="form-error">{errors.severity}</div>}
            </div>
          </div>
        </div>

        {/* SECTION 2: Deskripsi & Analisis */}
        <div className="form-section">
          <div className="form-section-header">
            <div className="form-section-number">2</div>
            <div>
              <h3>Deskripsi & Analisis</h3>
              <p>Detail kronologis kejadian dan analisis permasalahan</p>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Detail Problem <span className="required">*</span></label>
            <textarea
              className={`form-textarea ${errors.detail_problem ? 'input-error' : ''}`}
              rows={4}
              placeholder="Deskripsikan kronologis dan detail teknis insiden yang terjadi..."
              value={form.detail_problem}
              onChange={e => update('detail_problem', e.target.value)}
              id="field-detail"
            />
            <div className="form-hint">{form.detail_problem.length}/20 karakter minimum</div>
            {errors.detail_problem && <div className="form-error">{errors.detail_problem}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Root Cause Analysis <span className="required">*</span></label>
            <textarea
              className={`form-textarea ${errors.root_cause ? 'input-error' : ''}`}
              rows={3}
              placeholder="Jelaskan analisis akar masalah penyebab insiden..."
              value={form.root_cause}
              onChange={e => update('root_cause', e.target.value)}
              id="field-rootcause"
            />
            {errors.root_cause && <div className="form-error">{errors.root_cause}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Action Plan <span className="required">*</span></label>
            <textarea
              className={`form-textarea ${errors.action_plan ? 'input-error' : ''}`}
              rows={3}
              placeholder="Langkah workaround dan/atau permanent solution yang dilakukan..."
              value={form.action_plan}
              onChange={e => update('action_plan', e.target.value)}
              id="field-actionplan"
            />
            {errors.action_plan && <div className="form-error">{errors.action_plan}</div>}
          </div>
        </div>

        {/* SECTION 3: Target & Penanggung Jawab */}
        <div className="form-section">
          <div className="form-section-header">
            <div className="form-section-number">3</div>
            <div>
              <h3>Target & Penanggung Jawab</h3>
              <p>Informasi penyelesaian dan PIC</p>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Target Penyelesaian <span className="required">*</span></label>
              <input
                type="date"
                className={`form-input ${errors.target_action_plan ? 'input-error' : ''}`}
                value={form.target_action_plan}
                onChange={e => update('target_action_plan', e.target.value)}
                id="field-target-date"
              />
              {errors.target_action_plan && <div className="form-error">{errors.target_action_plan}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Status Action Plan <span className="required">*</span></label>
              <select
                className="form-select"
                value={form.status_action_plan}
                onChange={e => update('status_action_plan', e.target.value)}
                id="field-status"
              >
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nama SME (Subject Matter Expert) <span className="required">*</span></label>
              <input
                type="text"
                className={`form-input ${errors.nama_sme ? 'input-error' : ''}`}
                placeholder="Ketik nama PIC / SME"
                value={form.nama_sme}
                onChange={e => update('nama_sme', e.target.value)}
                id="field-sme"
              />
              {errors.nama_sme && <div className="form-error">{errors.nama_sme}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Nama Department <span className="required">*</span></label>
              <input
                type="text"
                className={`form-input ${errors.nama_department ? 'input-error' : ''}`}
                placeholder="Ketik nama department / unit kerja"
                value={form.nama_department}
                onChange={e => update('nama_department', e.target.value)}
                id="field-department"
              />
              {errors.nama_department && <div className="form-error">{errors.nama_department}</div>}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={() => router.back()} disabled={saving}>
            Batal
          </button>
          <button className="btn btn-primary" onClick={() => handleSave(false)} disabled={saving} id="btn-save-draft">
            {saving ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <Save size={16} />}
            Simpan Draft
          </button>
        </div>
      </div>
    </div>
  );
}
