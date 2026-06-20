// Utility functions

export function formatDate(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatTime(time) {
  if (!time) return '-';
  return time;
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatDowntime(minutes) {
  if (!minutes) return '-';
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours} jam ${mins} menit` : `${hours} jam`;
}

export function generateId() {
  return 'INC-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

export function getSeverityColor(severity) {
  const colors = { Low: '#1DD1A1', Medium: '#FECA57', High: '#FF6B6B' };
  return colors[severity] || '#A0A0B0';
}

export function getStatusColor(status) {
  const colors = { Open: '#FF6B6B', 'In Progress': '#FECA57', Resolved: '#48DBFB', Closed: '#1DD1A1' };
  return colors[status] || '#A0A0B0';
}

export function getWorkflowColor(status) {
  const colors = { Draft: '#A0A0B0', 'Pending Review': '#FECA57', Approved: '#1DD1A1', Rejected: '#FF6B6B' };
  return colors[status] || '#A0A0B0';
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function truncate(str, length = 80) {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
}

export function daysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
