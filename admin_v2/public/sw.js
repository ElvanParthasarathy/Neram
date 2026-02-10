// Minimal Service Worker to satisfy PWA requirements
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // Required to be an installable PWA
  event.respondWith(fetch(event.request));
});