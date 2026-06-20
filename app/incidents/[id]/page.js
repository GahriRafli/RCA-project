'use client';
import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useIncidents } from '@/lib/incidents';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate, formatDowntime, formatDateTime } from '@/lib/utils';
import { DEMO_USERS } from '@/lib/constants';
import {
  ArrowLeft, Send, CheckCircle, XCircle, AlertTriangle,
  Clock, Server, Activity, User, Building, FileText, Pin, PinOff, Edit
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function IncidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, hasRole } = useAuth();
  const { incidents, auditTrail, submitForReview, approveIncident, rejectIncident, togglePin } = useIncidents();

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const incident = incidents.find(i => i.id === params.id);
  const incidentAudit = useMemo(() => {
    return auditTrail
      .filter(a => a.incident_id === params.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [auditTrail, params.id]);

  if (!incident) {
    return (
      <div className="empty-state" style={{ marginTop: 80 }}>
        <AlertTriangle size={48} />
        <h3>Incident Tidak Ditemukan</h3>
        <p>ID: {params.id}</p>
        <button className="btn btn-ghost mt-md" onClick={() => router.push('/incidents')}>
          <ArrowLeft size={16} /> Kembali ke List
        </button>
      </div>
    );
  }

  const creatorName = DEMO_USERS.find(u => u.id === incident.created_by)?.name || '-';
  const reviewerName = DEMO_USERS.find(u => u.id === incident.reviewed_by)?.name || '-';

  const canSubmit = hasRole('maker', 'superadmin') && (incident.workflow_status === 'Draft' || incident.workflow_status === 'Rejected');
  const canApprove = hasRole('checker', 'superadmin') && incident.workflow_status === 'Pending Review';
  const canPin = hasRole('superadmin');

  const handleSubmit = async () => {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 400));
    submitForReview(incident.id, user.id, user.name);
    toast.success('Incident diajukan untuk review');
    setProcessing(false);
  };

  const handleApprove = async () => {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 400));
    approveIncident(incident.id, user.id, user.name);
    toast.success('Incident disetujui');
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!rejectNote.trim()) {
      toast.error('Catatan penolakan wajib diisi');
      return;
    }
    setProcessing(true);
    await new Promise(r => setTimeout(r, 400));
    rejectIncident(incident.id, rejectNote, user.id, user.name);
    toast.success('Incident ditolak');
    setShowRejectModal(false);
    setRejectNote('');
    setProcessing(false);
  };

  const handlePin = () => {
    togglePin(incident.id, user.id, user.name);
    toast.success(incident.is_pinned ? 'Incident di-unpin' : 'Incident di-pin sebagai frequent');
  };

  return (
    <div className="animate-fade">
      {/* Header */}
      <div className="page-header page-header-actions">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-icon" onClick={() => router.back()}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="text-mono" style={{ fontSize: '1.2rem' }}>{incident.id}</span>
              <StatusBadge type="workflow" value={incident.workflow_status} />
              {incident.is_pinned && <Pin size={16} style={{ color: 'var(--primary-light)' }} />}
            </h2>
            <p>{incident.aplikasi} — {formatDate(incident.problem_date)}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {canPin && (
            <button className="btn btn-ghost btn-sm" onClick={handlePin}>
              {incident.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
              {incident.is_pinned ? 'Unpin' : 'Pin Frequent'}
            </button>
          )}
          {canSubmit && (
            <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={processing}>
              <Send size={14} /> Submit Review
            </button>
          )}
          {canApprove && (
            <>
              <button className="btn btn-success btn-sm" onClick={handleApprove} disabled={processing}>
                <CheckCircle size={14} /> Approve
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => setShowRejectModal(true)} disabled={processing}>
                <XCircle size={14} /> Reject
              </button>
            </>
          )}
        </div>
      </div>

      {/* Rejection Banner */}
      {incident.workflow_status === 'Rejected' && incident.rejection_note && (
        <div className="rejection-banner">
          <AlertTriangle size={18} className="icon" />
          <div className="text">
            <strong>Ditolak oleh Checker</strong>
            {incident.rejection_note}
          </div>
        </div>
      )}

      {/* Detail Grid */}
      <div className="detail-grid mb-lg">
        <div className="detail-item">
          <div className="label"><Clock size={12} style={{ display: 'inline', marginRight: 4 }} /> Problem Date</div>
          <div className="value">{formatDate(incident.problem_date)}</div>
        </div>
        <div className="detail-item">
          <div className="label"><Clock size={12} style={{ display: 'inline', marginRight: 4 }} /> Jam Incident</div>
          <div className="value text-mono">{incident.jam_incident}</div>
        </div>
        <div className="detail-item">
          <div className="label"><Server size={12} style={{ display: 'inline', marginRight: 4 }} /> Aplikasi</div>
          <div className="value">{incident.aplikasi}</div>
        </div>
        <div className="detail-item">
          <div className="label"><Server size={12} style={{ display: 'inline', marginRight: 4 }} /> Nama Platform</div>
          <div className="value">{incident.nama_platform}</div>
        </div>
        <div className="detail-item">
          <div className="label"><Activity size={12} style={{ display: 'inline', marginRight: 4 }} /> Severity</div>
          <div className="value"><StatusBadge type="severity" value={incident.severity} /></div>
        </div>
        <div className="detail-item">
          <div className="label"><Clock size={12} style={{ display: 'inline', marginRight: 4 }} /> Lama Downtime</div>
          <div className="value text-mono">{formatDowntime(incident.lama_downtime)}</div>
        </div>
        <div className="detail-item">
          <div className="label">Status Action Plan</div>
          <div className="value"><StatusBadge type="status" value={incident.status_action_plan} /></div>
        </div>
        <div className="detail-item">
          <div className="label">Target Action Plan</div>
          <div className="value">{formatDate(incident.target_action_plan)}</div>
        </div>
        <div className="detail-item">
          <div className="label"><User size={12} style={{ display: 'inline', marginRight: 4 }} /> SME</div>
          <div className="value">{incident.nama_sme}</div>
        </div>
        <div className="detail-item">
          <div className="label"><Building size={12} style={{ display: 'inline', marginRight: 4 }} /> Department</div>
          <div className="value">{incident.nama_department}</div>
        </div>

        {/* Impacted Apps */}
        {incident.aplikasi_terimpact?.length > 0 && (
          <div className="detail-item detail-full">
            <div className="label">Aplikasi Terimpact</div>
            <div className="chip-container" style={{ marginTop: 6 }}>
              {incident.aplikasi_terimpact.map(a => (
                <div key={a} className="chip">{a}</div>
              ))}
            </div>
          </div>
        )}

        {/* Text fields */}
        <div className="detail-item detail-full">
          <div className="label"><FileText size={12} style={{ display: 'inline', marginRight: 4 }} /> Detail Problem</div>
          <div className="value" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{incident.detail_problem}</div>
        </div>
        <div className="detail-item detail-full">
          <div className="label">Root Cause</div>
          <div className="value" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{incident.root_cause}</div>
        </div>
        <div className="detail-item detail-full">
          <div className="label">Action Plan</div>
          <div className="value" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{incident.action_plan}</div>
        </div>
      </div>

      {/* Audit info */}
      <div className="card" style={{ maxWidth: 600, marginBottom: 24 }}>
        <div className="card-header">
          <h3 className="card-title">📋 Informasi Audit</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.85rem' }}>
          <div><span className="text-muted">Dibuat oleh:</span> {creatorName}</div>
          <div><span className="text-muted">Direview oleh:</span> {reviewerName}</div>
          <div><span className="text-muted">Dibuat:</span> {formatDateTime(incident.created_at)}</div>
          <div><span className="text-muted">Diperbarui:</span> {formatDateTime(incident.updated_at)}</div>
        </div>
      </div>

      {/* Audit Trail */}
      {incidentAudit.length > 0 && (
        <div className="card" style={{ maxWidth: 600 }}>
          <div className="card-header">
            <h3 className="card-title">🕐 Riwayat Aktivitas</h3>
          </div>
          <div className="timeline">
            {incidentAudit.map(a => (
              <div key={a.id} className="timeline-item">
                <div className="time">{formatDateTime(a.created_at)}</div>
                <div className="desc">{a.details?.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-backdrop" onClick={() => setShowRejectModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tolak Incident</h3>
              <button className="modal-close" onClick={() => setShowRejectModal(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Catatan Penolakan <span className="required">*</span></label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="Jelaskan alasan penolakan dan apa yang perlu direvisi..."
                  value={rejectNote}
                  onChange={e => setRejectNote(e.target.value)}
                  id="reject-note"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowRejectModal(false)}>Batal</button>
              <button className="btn btn-danger" onClick={handleReject} disabled={processing}>
                {processing ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <XCircle size={16} />}
                Tolak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
