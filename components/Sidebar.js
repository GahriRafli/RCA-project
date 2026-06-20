'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useIncidents } from '@/lib/incidents';
import {
  LayoutDashboard, FileText, Plus, CheckSquare, Pin, MessageSquare,
  Download, LogOut, Menu, X, AlertTriangle, Shield, Mic
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout, hasRole } = useAuth();
  const { incidents } = useIncidents();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const pendingCount = incidents.filter(i => i.workflow_status === 'Pending Review').length;

  const navItems = [
    { label: 'Main', type: 'section' },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['maker', 'checker', 'superadmin'] },
    { href: '/rca', label: 'Laporan RCA', icon: Mic, roles: ['maker', 'checker', 'superadmin'] },
    { href: '/incidents', label: 'Incidents', icon: FileText, roles: ['maker', 'checker', 'superadmin'] },
    { href: '/incidents/new', label: 'Buat Incident', icon: Plus, roles: ['maker', 'superadmin'] },
    { href: '/review', label: 'Review Queue', icon: CheckSquare, roles: ['checker', 'superadmin'], badge: pendingCount },

    { label: 'Admin', type: 'section', roles: ['superadmin'] },
    { href: '/admin/frequent', label: 'Frequent Incidents', icon: Pin, roles: ['superadmin'] },
    { href: '/admin/whatsapp', label: 'WA Scheduler', icon: MessageSquare, roles: ['superadmin'] },
    { href: '/admin/export', label: 'Export Center', icon: Download, roles: ['checker', 'superadmin'] },
  ];

  const filteredItems = navItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(user.role);
  });

  const initials = user.name?.split(' ').map(n => n[0]).join('').substring(0, 2) || '?';

  return (
    <>
      {/* Mobile header */}
      <div className="mobile-header">
        <button className="mobile-menu-btn" onClick={() => setOpen(true)}>
          <Menu size={22} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="sidebar-logo" style={{ width: 30, height: 30, fontSize: '0.8rem' }}>RP</div>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Remittance Portal</span>
        </div>
        <div style={{ width: 38 }} />
      </div>

      {/* Overlay */}
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />

      {/* Sidebar */}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">RP</div>
          <div className="sidebar-brand">
            <h1>Remittance Portal</h1>
            <span>IT Operations</span>
          </div>
          <button
            className="mobile-menu-btn"
            onClick={() => setOpen(false)}
            style={{ display: 'none', marginLeft: 'auto' }}
            id="sidebar-close-btn"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {filteredItems.map((item, i) => {
            if (item.type === 'section') {
              return <div key={i} className="nav-section-label">{item.label}</div>;
            }
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setOpen(false)}
              >
                <Icon className="nav-icon" size={18} />
                {item.label}
                {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="name">{user.name}</div>
              <div className="role">
                {user.role === 'superadmin' ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Shield size={10} /> Superadmin
                  </span>
                ) : user.role === 'checker' ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertTriangle size={10} /> Checker
                  </span>
                ) : 'Maker'}
              </div>
            </div>
            <button className="sidebar-logout" onClick={logout} title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile close btn style fix */}
      <style jsx global>{`
        @media (max-width: 768px) {
          #sidebar-close-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
