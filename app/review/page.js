'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useIncidents } from '@/lib/incidents';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate, formatDowntime, truncate } from '@/lib/utils';
import { DEMO_USERS } from '@/lib/constants';
import {
  CheckCircle, XCircle, Eye, Clock, AlertTriangle, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReviewQueuePage() {
  const { user, hasRole } = useAuth();
  const { incidents, approveIncident, rejectIncident } = useIncidents();
  const [activeTab, setActiveTab] = useState('pending');
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const pending = useMemo(() => incidents.filter(i => i.workflow_status === 'Pending Review'), [incidents]);
  const approved = useMemo(() => incidents.filter(i => i.workflow_status === 'Approved'), [incidents]);
  const rejected = useMemo(() => incidents.filter(i => i.workflow_status === 'Rejected'), [incidents]);

  const currentList = activeTab === 'pending' ? pending : activeTab === 'approved' ? approved : rejected;

  const handleApprove = async (id) => {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 400));
    approveIncident(id, user.id, user.name);
    toast.success('Incident disetujui');
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!rejectNote.trim()) { toast.error('Catatan wajib diisi'); return; }
    setProcessing(true);
    await new Promise(r => setTimeout(r, 400));
    rejectIncident(showRejectModal, rejectNote, user.id, user.name);
    toast.success('Incident ditolak');
    setShowRejectModal(null);
    setRejectNote('');
    setProcessing(false);
  };

  if (!hasRole('checker', 'superadmin')) {
    return (
      <div className="empty-state" style={{ marginTop: 80 }}>
        <AlertTriangle size={48} />
        <h3>Akses Ditolak</h3>
        <p>Hanya Checker dan Superadmin yang dapat mengakses halaman ini.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade">
      <div className="page-header">
        <h2>Review Queue</h2>
        <p>Tinjau dan validasi laporan insiden dari Maker</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
          <Clock size={14} style={{ marginRight: 6 }} /> Pending Review ({pending.length})
        </button>
        <button className={`tab ${activeTab === 'approved' ? 'active' : ''}`} onClick={() => setActiveTab('approved')}>
          <CheckCircle size={14} style={{ marginRight: 6 }} /> Approved ({approved.length})
        </button>
        <button className={`tab ${activeTab === 'rejected' ? 'active' : ''}`} onClick={() => setActiveTab('rejected')}>
          <XCircle size={14} style={{ marginRight: 6 }} /> Rejected ({rejected.length})
        </button>
      </div>

      {/* Table */}
      {currentList.length === 0 ? (
        <div className="empty-state">
          <Filter size={48} />
          <h3>Tidak ada insiden {activeTab}</h3>
          <p>Semua insiden sudah ditinjau</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tanggal</th>
                <th>Aplikasi</th>
                <th>Severity</th>
                <th>Detail</th>
                <th>Dibuat oleh</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {currentList.map(inc => {
                const creator = DEMO_USERS.find(u => u.id === inc.created_by)?.name || '-';
                return (
                  <tr key={inc.id}>
                    <td className="text-mono" style={{ fontSize: '0.78rem' }}>{inc.id}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(inc.problem_date)}</td>
                    <td>{inc.aplikasi}</td>
                    <td><StatusBadge type="severity" value={inc.severity} /></td>
                    <td style={{ maxWidth: 250 }}>{truncate(inc.detail_problem, 50)}</td>
                    <td>{creator}</td>
                    <td><StatusBadge type="workflow" value={inc.workflow_status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link href={`/incidents/${inc.id}`} className="btn btn-ghost btn-sm btn-icon" title="Detail">
                          <Eye size={14} />
                        </Link>
                        {activeTab === 'pending' && (
                          <>
                            <button className="btn btn-success btn-sm btn-icon" onClick={() => handleApprove(inc.id)} disabled={processing} title="Approve">
                              <CheckCircle size={14} />
                            </button>
                            <button className="btn btn-danger btn-sm btn-icon" onClick={() => setShowRejectModal(inc.id)} disabled={processing} title="Reject">
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-backdrop" onClick={() => setShowRejectModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tolak Incident</h3>
              <button className="modal-close" onClick={() => setShowRejectModal(null)}>
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Catatan Penolakan <span className="required">*</span></label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="Jelaskan alasan penolakan..."
                  value={rejectNote}
                  onChange={e => setRejectNote(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowRejectModal(null)}>Batal</button>
              <button className="btn btn-danger" onClick={handleReject} disabled={processing}>
                <XCircle size={16} /> Tolak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
