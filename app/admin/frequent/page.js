'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useIncidents } from '@/lib/incidents';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate, truncate } from '@/lib/utils';
import { Pin, PinOff, Eye, AlertTriangle, Star, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FrequentIncidentsPage() {
  const { user, hasRole } = useAuth();
  const { incidents, togglePin } = useIncidents();
  const [view, setView] = useState('pinned'); // 'pinned' | 'auto'

  // Auto-detect frequent incidents: same app appearing ≥ 2 times
  const autoDetected = useMemo(() => {
    const appCount = {};
    incidents.forEach(i => {
      appCount[i.aplikasi] = (appCount[i.aplikasi] || 0) + 1;
    });
    const frequentApps = Object.entries(appCount).filter(([, c]) => c >= 2).map(([app]) => app);
    return incidents.filter(i => frequentApps.includes(i.aplikasi) && !i.is_pinned)
      .sort((a, b) => {
        const countA = appCount[a.aplikasi];
        const countB = appCount[b.aplikasi];
        return countB - countA;
      });
  }, [incidents]);

  const pinned = useMemo(() => incidents.filter(i => i.is_pinned), [incidents]);
  const currentList = view === 'pinned' ? pinned : autoDetected;

  if (!hasRole('superadmin')) {
    return (
      <div className="empty-state" style={{ marginTop: 80 }}>
        <AlertTriangle size={48} />
        <h3>Akses Ditolak</h3>
        <p>Hanya Superadmin yang dapat mengakses halaman ini.</p>
      </div>
    );
  }

  const handleToggle = (id) => {
    togglePin(id, user.id, user.name);
    toast.success('Status pin diperbarui');
  };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <h2>Frequent Incidents</h2>
        <p>Tandai insiden yang sering terjadi untuk evaluasi SLA dan prioritas solusi permanen</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${view === 'pinned' ? 'active' : ''}`} onClick={() => setView('pinned')}>
          <Star size={14} style={{ marginRight: 6 }} /> Pinned ({pinned.length})
        </button>
        <button className={`tab ${view === 'auto' ? 'active' : ''}`} onClick={() => setView('auto')}>
          <TrendingUp size={14} style={{ marginRight: 6 }} /> Auto-Detected ({autoDetected.length})
        </button>
      </div>

      {currentList.length === 0 ? (
        <div className="empty-state">
          <Pin size={48} />
          <h3>{view === 'pinned' ? 'Belum ada incident yang di-pin' : 'Tidak ada incident recurring terdeteksi'}</h3>
          <p>{view === 'pinned' ? 'Pin incident dari halaman list atau dari tab Auto-Detected' : 'Semua aplikasi berjalan normal'}</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>Pin</th>
                <th>ID</th>
                <th>Tanggal</th>
                <th>Aplikasi</th>
                <th>Severity</th>
                <th>Root Cause</th>
                <th>Status</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {currentList.map(inc => (
                <tr key={inc.id} className={inc.is_pinned ? 'pinned' : ''}>
                  <td>
                    <button
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: inc.is_pinned ? 'var(--primary-light)' : 'var(--text-muted)', padding: 4 }}
                      onClick={() => handleToggle(inc.id)}
                      title={inc.is_pinned ? 'Unpin' : 'Pin'}
                    >
                      {inc.is_pinned ? <PinOff size={16} /> : <Pin size={16} />}
                    </button>
                  </td>
                  <td className="text-mono" style={{ fontSize: '0.78rem' }}>{inc.id}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDate(inc.problem_date)}</td>
                  <td>{inc.aplikasi}</td>
                  <td><StatusBadge type="severity" value={inc.severity} /></td>
                  <td style={{ maxWidth: 300 }}>{truncate(inc.root_cause, 60)}</td>
                  <td><StatusBadge type="status" value={inc.status_action_plan} /></td>
                  <td>
                    <Link href={`/incidents/${inc.id}`} className="btn btn-ghost btn-sm btn-icon">
                      <Eye size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
