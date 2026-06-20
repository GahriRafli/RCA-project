'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const url = '/sw.js';
      navigator.serviceWorker
        .getRegistration()
        .then((reg) => {
          if (!reg) {
            navigator.serviceWorker.register(url).catch((err) => {
              console.warn('Service worker registration failed:', err);
            });
          }
        })
        .catch(() => {
          // ignore
        });
    }
  }, []);

  return null;
}
