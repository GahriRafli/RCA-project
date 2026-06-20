'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { DEMO_USERS } from './constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('remittance_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const login = (nip, password) => {
    const found = DEMO_USERS.find(u => u.nip === nip && u.password === password);
    if (!found) return { success: false, error: 'NIP atau password salah' };
    const userData = { ...found };
    delete userData.password;
    setUser(userData);
    localStorage.setItem('remittance_user', JSON.stringify(userData));
    return { success: true, user: userData };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('remittance_user');
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
