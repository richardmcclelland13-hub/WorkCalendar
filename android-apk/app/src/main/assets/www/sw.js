const CACHE_NAME = 'shift-calendar-v19';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './styles.css?v=20260303b',
  './app.js',
  './app.js?v=20260303b',
  './tracker.js',
  './tracker.js?v=20260303b',
  './tracker-db.js',
  './tracker-db.js?v=20260303b',
  './manifest.json',
  './manifest.json?v=20260303b',
  './icon.svg',
  './icon.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/maskable-512.png',
  './assets/suncor-shift-logo.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
