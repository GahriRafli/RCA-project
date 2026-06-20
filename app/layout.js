import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'App RCA — Laporan RCA',
  description: 'Aplikasi laporan RCA untuk analisis akar masalah dan dokumentasi insiden.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1A1A2E',
                color: '#EAEAFF',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontFamily: 'Inter, sans-serif',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
