// js/supabase.js
// ============================================================
// Konfigurasi Supabase Client untuk KASIRKU — Browser UMD
// v10: Fix 403 race condition — session di-restore sebelum query pertama
// ============================================================

(function () {
  const SUPABASE_URL      = localStorage.getItem('__kasirku_sb_url')  || 'https://fzuhmyzyraizizpxkltr.supabase.co';
  const SUPABASE_ANON_KEY = localStorage.getItem('__kasirku_sb_key')  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dWhteXp5cmFpeml6cHhrbHRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMTQ0NTIsImV4cCI6MjA5Mzc5MDQ1Mn0.qy1_36YicMBg2-t4f4ynQnDX0kaOXBVauKf40RdedBI';

  window.__KASIRKU_URL__ = SUPABASE_URL;
  window.__KASIRKU_KEY__ = SUPABASE_ANON_KEY;

  // Promise yang resolve setelah session di-restore — dipakai app.js sebagai guard
  window.__KASIRKU_READY__ = new Promise((resolve) => {
    function _initClient() {
      if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: {
            persistSession:     true,
            autoRefreshToken:   true,
            detectSessionInUrl: true,
            storageKey:         'kasirku-auth-token',
          },
          realtime: { params: { eventsPerSecond: 10 } },
        });

        window.__SB_CLIENT__ = client;

        // ── FIX UTAMA: pulihkan session sebelum query apapun ──
        // Tanpa ini, request pertama jalan tanpa Authorization header → 403
        client.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            console.log('[KASIRKU] Session restored ✓', session.user?.email);
          } else {
            console.log('[KASIRKU] No active session (halaman login)');
          }
          resolve(client); // Baru resolve setelah session siap
        }).catch(err => {
          console.warn('[KASIRKU] getSession error:', err.message);
          resolve(client); // Tetap resolve agar app tidak hang
        });

        // Listen perubahan auth state
        client.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_OUT') {
            localStorage.removeItem('kasirku_user');
          }
        });

        console.log('[KASIRKU] Supabase client initialized ✓');
        return true;
      }
      return false;
    }

    if (!_initClient()) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (_initClient()) {
          clearInterval(interval);
        } else if (attempts >= 20) {
          clearInterval(interval);
          console.error('[KASIRKU] supabase-js CDN gagal dimuat!');
          resolve(null);
        }
      }, 100);
    }
  });

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    const swPath = (function () {
      const scripts = document.querySelectorAll('script[src*="supabase.js"]');
      if (scripts.length > 0) {
        const src = scripts[0].getAttribute('src') || '';
        if (src.startsWith('../')) return '../sw.js';
      }
      return 'sw.js';
    })();

    window.addEventListener('load', () => {
      navigator.serviceWorker.register(swPath)
        .then(reg => console.log('[KASIRKU SW] Registered ✓ scope:', reg.scope))
        .catch(err => console.warn('[KASIRKU SW] Register skipped (ok untuk dev):', err.message));
    });
  }
})();
