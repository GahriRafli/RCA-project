'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  LogOut, Menu, X, Shield, Mic, AlertTriangle
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const navItems = [
    { label: 'Main', type: 'section' },
    { href: '/rca', label: 'Laporan RCA', icon: Mic, roles: ['maker', 'checker', 'superadmin'] },
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
          <div className="sidebar-logo" style={{ width: 30, height: 30, fontSize: '0.8rem' }}>RCA</div>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>App RCA</span>
        </div>
        <div style={{ width: 38 }} />
      </div>

      {/* Overlay */}
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />

      {/* Sidebar */}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">RCA</div>
          <div className="sidebar-brand">
            <h1>App RCA</h1>
            <span>Laporan RCA</span>
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
            const isActive = pathname === item.href || pathname?.startsWith(item.href);
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
