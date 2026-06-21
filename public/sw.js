// Minimal service worker to prevent 404 in dev/prod when no SW is needed
self.addEventListener('install', (event) => {
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', (event) => {
  // no-op: allow network to handle requests
});
