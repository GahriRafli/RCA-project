'use client';
import { useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { useIncidents } from '@/lib/incidents';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate, formatDowntime, truncate } from '@/lib/utils';
import {
  AlertTriangle, Activity, Clock, CheckCircle, TrendingUp, TrendingDown,
  Pin, BarChart3
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend, Area, AreaChart
} from 'recharts';

const CHART_COLORS = ['#4F46E5', '#0EA5E9', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#06B6D4', '#EC4899'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E2E8F0',
      borderRadius: 10, padding: '10px 14px', fontSize: '0.8rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    }}>
      <div style={{ color: '#64748B', marginBottom: 4, fontWeight: 600 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#0F172A' }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { incidents, auditTrail } = useIncidents();

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = incidents.filter(i => {
      const d = new Date(i.problem_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const lastMonth = incidents.filter(i => {
      const d = new Date(i.problem_date);
      const lm = new Date(now);
      lm.setMonth(lm.getMonth() - 1);
      return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
    });

    const totalThis = thisMonth.length;
    const totalLast = lastMonth.length;
    const highSeverity = thisMonth.filter(i => i.severity === 'High').length;
    const openIcns = incidents.filter(i => i.status_action_plan === 'Open' || i.status_action_plan === 'In Progress').length;
    const avgDowntime = thisMonth.length > 0
      ? Math.round(thisMonth.reduce((a, i) => a + i.lama_downtime, 0) / thisMonth.length)
      : 0;

    // Severity distribution
    const severityDist = [
      { name: 'Low', value: incidents.filter(i => i.severity === 'Low').length },
      { name: 'Medium', value: incidents.filter(i => i.severity === 'Medium').length },
      { name: 'High', value: incidents.filter(i => i.severity === 'High').length },
    ];

    // Top applications
    const appCount = {};
    incidents.forEach(i => { appCount[i.aplikasi] = (appCount[i.aplikasi] || 0) + 1; });
    const topApps = Object.entries(appCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name: name.length > 20 ? name.substring(0, 18) + '...' : name, count }));

    // Daily trend (last 30 days)
    const trend = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayLabel = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      const count = incidents.filter(inc => inc.problem_date === dateStr).length;
      trend.push({ date: dayLabel, count });
    }

    // Department dist
    const deptCount = {};
    incidents.forEach(i => { deptCount[i.nama_department] = (deptCount[i.nama_department] || 0) + 1; });
    const deptDist = Object.entries(deptCount)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name: name.length > 15 ? name.substring(0, 13) + '...' : name, count }));

    // Pinned incidents
    const pinned = incidents.filter(i => i.is_pinned);

    return { totalThis, totalLast, highSeverity, openIcns, avgDowntime, severityDist, topApps, trend, deptDist, pinned };
  }, [incidents]);

  const recentAudit = auditTrail.slice(0, 8);

  const sevColors = { Low: '#10B981', Medium: '#F59E0B', High: '#EF4444' };
  const trendChange = stats.totalLast > 0
    ? Math.round(((stats.totalThis - stats.totalLast) / stats.totalLast) * 100)
    : 0;

  return (
    <div className="animate-fade">
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Selamat datang, {user.name} — ringkasan insiden operasional IT</p>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5' }}>
            <Activity size={20} />
          </div>
          <div className="kpi-value">{stats.totalThis}</div>
          <div className="kpi-label">Insiden Bulan Ini</div>
          {trendChange !== 0 && (
            <div className={`kpi-trend ${trendChange > 0 ? 'up' : 'down'}`}>
              {trendChange > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(trendChange)}% vs bulan lalu
            </div>
          )}
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
            <AlertTriangle size={20} />
          </div>
          <div className="kpi-value">{stats.highSeverity}</div>
          <div className="kpi-label">High Severity</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
            <Clock size={20} />
          </div>
          <div className="kpi-value">{formatDowntime(stats.avgDowntime)}</div>
          <div className="kpi-label">Avg. Downtime</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
            <CheckCircle size={20} />
          </div>
          <div className="kpi-value">{stats.openIcns}</div>
          <div className="kpi-label">Open / In Progress</div>
        </div>
      </div>

      {/* Pinned / Frequent Incidents */}
      {stats.pinned.length > 0 && (
        <div className="pinned-section">
          <div className="pinned-section-header">
            <Pin size={16} style={{ color: 'var(--primary-light)' }} />
            <h3>Frequent Incidents (Pinned)</h3>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Aplikasi</th>
                  <th>Severity</th>
                  <th>Root Cause</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.pinned.map(inc => (
                  <tr key={inc.id} className="pinned">
                    <td className="text-mono" style={{ fontSize: '0.78rem' }}>{inc.id}</td>
                    <td>{inc.aplikasi}</td>
                    <td><StatusBadge type="severity" value={inc.severity} /></td>
                    <td style={{ maxWidth: 300 }}>{truncate(inc.root_cause, 60)}</td>
                    <td><StatusBadge type="status" value={inc.status_action_plan} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="charts-grid">
        {/* Incident Trend */}
        <div className="chart-card">
          <h3>📈 Tren Insiden (30 Hari Terakhir)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={stats.trend} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} interval={4} />
              <YAxis tick={{ fill: '#64748B', fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#4F46E5" fill="url(#trendGrad)" name="Insiden" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Severity Distribution */}
        <div className="chart-card">
          <h3>🎯 Distribusi Severity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={stats.severityDist}
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={55}
                paddingAngle={4}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {stats.severityDist.map((entry) => (
                  <Cell key={entry.name} fill={sevColors[entry.name]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Applications */}
        <div className="chart-card">
          <h3>📊 Top Aplikasi Bermasalah</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.topApps} layout="vertical" margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis type="number" tick={{ fill: '#64748B', fontSize: 11 }} allowDecimals={false} />
              <YAxis dataKey="name" type="category" width={120} tick={{ fill: '#64748B', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Insiden" fill="#0EA5E9" radius={[0, 6, 6, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Department Distribution */}
        <div className="chart-card">
          <h3>🏢 Insiden per Department</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.deptDist} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fill: '#64748B', fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Insiden" radius={[4, 4, 0, 0]} barSize={24}>
                {stats.deptDist.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className="card" style={{ maxWidth: 600 }}>
        <div className="card-header">
          <h3 className="card-title">🕐 Aktivitas Terbaru</h3>
        </div>
        {recentAudit.length > 0 ? (
          <div className="timeline">
            {recentAudit.map(a => (
              <div key={a.id} className="timeline-item">
                <div className="time">{new Date(a.created_at).toLocaleString('id-ID')}</div>
                <div className="desc">{a.details?.message}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>Belum ada aktivitas</p>
          </div>
        )}
      </div>
    </div>
  );
}
