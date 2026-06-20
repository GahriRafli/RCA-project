import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { IncidentProvider } from '@/lib/incidents';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'Remittance Portal — IT Operations Incident Management',
  description: 'Internal IT Operations portal for incident recording, monitoring, and reporting with Maker-Checker workflow.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          <IncidentProvider>
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
          </IncidentProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
