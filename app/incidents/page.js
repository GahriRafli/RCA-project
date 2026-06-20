'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useIncidents } from '@/lib/incidents';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate, formatDowntime, truncate } from '@/lib/utils';
import { Search, Plus, ChevronLeft, ChevronRight, Eye, Pin, PinOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function IncidentsListPage() {
  const { user, hasRole } = useAuth();
  const { incidents, togglePin } = useIncidents();
  const [search, setSearch] = useState('');
  const [sevFilter, setSevFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [wfFilter, setWfFilter] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 12;

  const filtered = useMemo(() => {
    let list = [...incidents];

    // Role-based filtering
    if (user.role === 'maker') {
      list = list.filter(i => i.created_by === user.id);
    } else if (user.role === 'checker') {
      list = list.filter(i => i.workflow_status === 'Pending Review' || i.workflow_status === 'Approved');
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.id.toLowerCase().includes(q) ||
        i.aplikasi.toLowerCase().includes(q) ||
        i.detail_problem.toLowerCase().includes(q) ||
        i.nama_sme.toLowerCase().includes(q)
      );
    }
    if (sevFilter) list = list.filter(i => i.severity === sevFilter);
    if (statusFilter) list = list.filter(i => i.status_action_plan === statusFilter);
    if (wfFilter) list = list.filter(i => i.workflow_status === wfFilter);

    return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [incidents, user, search, sevFilter, statusFilter, wfFilter]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handlePin = (id) => {
    togglePin(id, user.id, user.name);
    toast.success('Status pin diperbarui');
  };

  return (
    <div className="animate-fade">
      <div className="page-header page-header-actions">
        <div>
          <h2>Incident List</h2>
          <p>{filtered.length} insiden ditemukan</p>
        </div>
        {hasRole('maker', 'superadmin') && (
          <Link href="/incidents/new" className="btn btn-primary">
            <Plus size={16} /> Buat Incident
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-input">
          <Search size={16} className="search-icon" />
          <input
            className="form-input"
            placeholder="Cari ID, aplikasi, detail, SME..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            id="incident-search"
          />
        </div>
        <select className="form-select" value={sevFilter} onChange={e => { setSevFilter(e.target.value); setPage(1); }}>
          <option value="">Semua Severity</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <select className="form-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">Semua Status</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>
        <select className="form-select" value={wfFilter} onChange={e => { setWfFilter(e.target.value); setPage(1); }}>
          <option value="">Semua Workflow</option>
          <option value="Draft">Draft</option>
          <option value="Pending Review">Pending Review</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {hasRole('superadmin') && <th style={{ width: 40 }}></th>}
              <th>ID</th>
              <th>Tanggal</th>
              <th>Aplikasi</th>
              <th>Severity</th>
              <th>Downtime</th>
              <th>Status</th>
              <th>Workflow</th>
              <th>SME</th>
              <th style={{ width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={hasRole('superadmin') ? 10 : 9} className="text-center text-muted" style={{ padding: 40 }}>
                  Tidak ada insiden ditemukan
                </td>
              </tr>
            ) : paginated.map(inc => (
              <tr key={inc.id} className={inc.is_pinned ? 'pinned' : ''}>
                {hasRole('superadmin') && (
                  <td>
                    <button
                      className="btn-icon"
                      onClick={() => handlePin(inc.id)}
                      title={inc.is_pinned ? 'Unpin' : 'Pin'}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: inc.is_pinned ? 'var(--primary-light)' : 'var(--text-muted)', padding: 4 }}
                    >
                      {inc.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
                    </button>
                  </td>
                )}
                <td className="text-mono" style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{inc.id}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{formatDate(inc.problem_date)}</td>
                <td>{truncate(inc.aplikasi, 25)}</td>
                <td><StatusBadge type="severity" value={inc.severity} /></td>
                <td className="text-mono" style={{ fontSize: '0.8rem' }}>{formatDowntime(inc.lama_downtime)}</td>
                <td><StatusBadge type="status" value={inc.status_action_plan} /></td>
                <td><StatusBadge type="workflow" value={inc.workflow_status} /></td>
                <td>{inc.nama_sme}</td>
                <td>
                  <Link href={`/incidents/${inc.id}`} className="btn btn-ghost btn-sm btn-icon" title="Lihat Detail">
                    <Eye size={15} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .map((p, i, arr) => {
              const prev = arr[i - 1];
              const showEllipsis = prev && p - prev > 1;
              return (
                <span key={p}>
                  {showEllipsis && <span style={{ color: 'var(--text-muted)', padding: '0 4px' }}>...</span>}
                  <button className={page === p ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
                </span>
              );
            })}
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
