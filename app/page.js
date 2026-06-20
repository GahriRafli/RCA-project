'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { DEMO_USERS } from '@/lib/constants';
import { Hash, Lock, LogIn, Shield, ChevronRight } from 'lucide-react';

export default function LoginPage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.push('/rca');
  }, [user, router]);

  if (user) return null;

  const handleNipChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    setNip(val);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!nip || nip.length < 4) {
      setError('NIP harus minimal 4 digit');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const result = login(nip, password);
    if (result.success) {
      router.push('/rca');
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  const fillDemo = (demoUser) => {
    setNip(demoUser.nip);
    setPassword(demoUser.password);
    setError('');
  };

  const roleIcons = { maker: '👷', checker: '🔍', superadmin: '🛡️' };
  const roleDesc = {
    maker: 'Akses laporan RCA dan perekaman suara',
    checker: 'Review hasil RCA dan laporan',
    superadmin: 'Akses penuh aplikasi RCA',
  };

  return (
    <div className="login-page">
      {/* Decorative shapes */}
      <div className="login-shape login-shape-1" />
      <div className="login-shape login-shape-2" />
      <div className="login-shape login-shape-3" />

      <div className="login-card">
        <div className="login-header">
          <div className="logo-wrapper">
            <Shield size={28} />
          </div>
          <h1>App RCA</h1>
          <p>Modul Laporan RCA untuk analisis akar masalah.</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">NIP (Nomor Induk Pegawai)</label>
            <div style={{ position: 'relative' }}>
              <Hash size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="form-input"
                style={{ paddingLeft: 40 }}
                placeholder="Masukkan NIP (angka)"
                value={nip}
                onChange={handleNipChange}
                maxLength={12}
                required
                autoFocus
                id="login-nip"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: 40 }}
                placeholder="Masukkan password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                id="login-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            id="login-submit"
            style={{ width: '100%', justifyContent: 'center', padding: '13px 20px', fontSize: '0.92rem' }}
          >
            {loading ? (
              <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
            ) : (
              <>
                <LogIn size={18} />
                Masuk
              </>
            )}
          </button>
        </form>

        <div className="demo-accounts">
          <h4>Demo Accounts — Klik untuk autofill</h4>
          {DEMO_USERS.map(u => (
            <div key={u.id} className="demo-account-item" onClick={() => fillDemo(u)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.2rem' }}>{roleIcons[u.role]}</span>
                <div>
                  <div className="account-role">{u.role}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{roleDesc[u.role]}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 6 }}>
                <div>
                  <div className="account-nip">NIP: {u.nip}</div>
                </div>
                <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
