// _sidebar.js — Tokku ERP/POS v2
// Shared sidebar + theme + auth guard

(function () {
  // ── Theme init (IIFE, berjalan sebelum render) ──
  const theme = localStorage.getItem('tokku_theme') || 'dark';
  if (theme === 'light') document.documentElement.classList.add('light-theme');

  window.addEventListener('storage', e => {
    if (e.key === 'tokku_theme') {
      if (e.newValue === 'light') document.documentElement.classList.add('light-theme');
      else document.documentElement.classList.remove('light-theme');
    }
  });
  try {
    const ch = new BroadcastChannel('tokku_theme_channel');
    ch.onmessage = e => {
      if (e.data?.theme === 'light') document.documentElement.classList.add('light-theme');
      else document.documentElement.classList.remove('light-theme');
    };
  } catch(e) {}
})();

// ── Render sidebar ──
function renderSidebar(activePage) {
  const navItems = [
    { section: 'Utama' },
    { href: 'dashboard.html',        icon: 'bxs-dashboard',        label: 'Dashboard' },
    { href: 'kasir.html',            icon: 'bx-receipt',           label: 'Kasir / POS', badge: 'HOT' },
    { href: 'transaksi.html',        icon: 'bx-list-ul',           label: 'Riwayat Transaksi' },
    { section: 'Inventori' },
    { href: 'produk.html',           icon: 'bx-package',           label: 'Produk & Stok' },
    { href: 'kategori.html',         icon: 'bx-folder-open',       label: 'Kategori' },
    { href: 'stok.html',             icon: 'bx-stats',             label: 'Monitor Stok' },
    { href: 'laporan-stok.html',     icon: 'bx-trending-up',       label: 'Laporan Stok' },
    { section: 'Keuangan' },
    { href: 'keuangan.html',         icon: 'bx-wallet-alt',        label: 'Keuangan & Kas' },
    { href: 'utang-piutang.html',    icon: 'bx-transfer-alt',      label: 'Utang & Piutang' },
    { section: 'Relasi' },
    { href: 'pelanggan.html',        icon: 'bx-group',             label: 'Pelanggan' },
    { section: 'Laporan' },
    { href: 'laporan-dashboard.html',icon: 'bx-pie-chart-alt-2',   label: 'Dashboard Laporan' },
    { href: 'laporan.html',          icon: 'bx-bar-chart-alt-2',   label: 'Laporan Penjualan' },
    { section: 'Pengaturan' },
    { href: 'cabang.html',           icon: 'bx-buildings',         label: 'Toko Cabang' },
    { href: 'pengguna.html',         icon: 'bx-user-circle',       label: 'Manajemen User' },
    { href: 'pengaturan.html',       icon: 'bx-cog',               label: 'Pengaturan' },
  ];

  const navHTML = navItems.map(item => {
    if (item.section) return `<div class="nav-section">${item.section}</div>`;
    const isActive = activePage === item.href ? 'active' : '';
    const badge = item.badge ? `<span class="nav-badge">${item.badge}</span>` : '';
    return `<a href="${item.href}" class="nav-item ${isActive}"><i class='bx ${item.icon}'></i> ${item.label}${badge}</a>`;
  }).join('');

  const user = getCurrentUser() || {};
  const name = user.name || user.email || 'User';
  const role = user.role || 'kasir';
  const roleLabel = { owner: 'Pemilik', manager: 'Manajer', kasir: 'Kasir', stoker: 'Stoker', admin: 'Admin' }[role] || role;
  const initial = name.charAt(0).toUpperCase();

  return `
    <aside class="sidebar" id="sidebar">
      <a href="dashboard.html" class="sidebar-brand">
        <div class="brand-icon"><i class='bx bx-store-alt'></i></div>
        <div>
          <div class="brand-name">Tokku<em>.</em></div>
          <div class="brand-sub">Toko Bangunan</div>
        </div>
      </a>
      <nav class="sidebar-nav">${navHTML}</nav>
      <div class="sidebar-footer">
        <div class="user-card">
          <div class="user-avatar" id="user-avatar">${initial}</div>
          <div class="user-info">
            <span id="user-name">${name}</span>
            <span id="user-role">${roleLabel}</span>
          </div>
          <button class="btn-logout" onclick="handleLogout()" title="Keluar">
            <i class='bx bx-log-out'></i>
          </button>
        </div>
      </div>
    </aside>
    <div id="sidebar-overlay" onclick="closeSidebar()"></div>
  `;
}

function injectSidebar(activePage) {
  const wrapper = document.querySelector('.app-wrapper');
  if (!wrapper) return;
  wrapper.insertAdjacentHTML('afterbegin', renderSidebar(activePage));
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('active');
}

function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('active');
}

async function handleLogout() {
  try {
    await KasirkuDB.Auth.logout();
  } catch (e) {}
  window.location.href = '../index.html';
}

// ── Auth guard ──
async function requireAuth() {
  await window.__KASIRKU_READY__;
  const isAuth = await KasirkuDB.Auth.isAuthenticated();
  if (!isAuth) window.location.href = '../index.html';
}

// ── Toggle theme ──
function toggleTheme() {
  const isLight = document.documentElement.classList.toggle('light-theme');
  const newTheme = isLight ? 'light' : 'dark';
  localStorage.setItem('tokku_theme', newTheme);
  try { new BroadcastChannel('tokku_theme_channel').postMessage({ theme: newTheme }); } catch(e) {}
}
