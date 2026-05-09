// ============================================================
// KASIRKU — Service Worker v10
// ============================================================

const CACHE_NAME = 'kasirku-v12';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/style.css',
  '/js/supabase.js',
  '/js/app.js',
  '/js/helpers.js',
  '/js/receipt.js',
  '/pages/dashboard.html',
  '/pages/kasir.html',
  '/pages/produk.html',
  '/pages/kategori.html',
  '/pages/transaksi.html',
  '/pages/laporan.html',
  '/pages/stok.html',
  '/pages/pelanggan.html',
  '/pages/pengguna.html',
  '/pages/pengaturan.html',
  '/pages/_sidebar.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

console.log('[KASIRKU SW] Service worker loaded ✓');

// Install: cache static assets
self.addEventListener('install', (event) => {
  console.log('[KASIRKU SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[KASIRKU SW] Caching static assets');
      // Cache individually so one failure doesn't break all
      return Promise.allSettled(
        STATIC_ASSETS.map(url => cache.add(url).catch(err => {
          console.warn('[KASIRKU SW] Could not cache:', url, err.message);
        }))
      );
    }).then(() => {
      console.log('[KASIRKU SW] Install complete');
      return self.skipWaiting();
    })
  );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  console.log('[KASIRKU SW] Activating...');
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[KASIRKU SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    ).then(() => {
      console.log('[KASIRKU SW] Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch: Network first for API, cache first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET dan SEMUA request cross-origin (Supabase, CDN, font, dll)
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // For same-origin requests: try network first, fall back to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          // For navigation requests, return index.html
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Offline - resource not available', { status: 503 });
        });
      })
  );
});
