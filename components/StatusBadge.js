'use client';

export function StatusBadge({ type, value }) {
  const classMap = {
    severity: {
      Low: 'badge-low',
      Medium: 'badge-medium',
      High: 'badge-high',
    },
    workflow: {
      Draft: 'badge-draft',
      'Pending Review': 'badge-pending',
      Approved: 'badge-approved',
      Rejected: 'badge-rejected',
    },
    status: {
      Open: 'badge-open',
      'In Progress': 'badge-inprogress',
      Resolved: 'badge-resolved',
      Closed: 'badge-closed',
    },
  };

  const dotMap = {
    severity: { Low: '●', Medium: '●', High: '●' },
    workflow: { Draft: '○', 'Pending Review': '◐', Approved: '●', Rejected: '✕' },
    status: { Open: '○', 'In Progress': '◐', Resolved: '◑', Closed: '●' },
  };

  const cls = classMap[type]?.[value] || '';
  const dot = dotMap[type]?.[value] || '';

  return (
    <span className={`badge ${cls}`}>
      {dot && <span style={{ fontSize: '0.6rem' }}>{dot}</span>}
      {value}
    </span>
  );
}
