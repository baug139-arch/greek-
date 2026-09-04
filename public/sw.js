// Service Worker for Koine Greek PWA - v3 (Cache Busting)
const CACHE_NAME = 'koine-greek-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png'
];

// Install Event - cache core shell & skip waiting immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate Event - clean up all caches to ensure clean React bundle sync
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Never intercept dev server / module scripts to prevent duplicate React runtimes
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Strictly skip chrome-extension, dev server modules, vite internals, node_modules, and hot updates
  if (
    !event.request.url.startsWith('http') ||
    url.pathname.includes('/@') ||
    url.pathname.includes('/node_modules/') ||
    url.pathname.includes('/src/') ||
    url.search.includes('v=') ||
    url.pathname.endsWith('.tsx') ||
    url.pathname.endsWith('.ts')
  ) {
    return;
  }

  // Network-first strategy for navigation
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }
});

