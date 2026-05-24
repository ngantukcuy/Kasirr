// _sidebar.js — Tokku ERP/POS v2
// Shared sidebar + theme + auth guard

(function () {
  const theme = localStorage.getItem('tokku_theme') || 'dark';
  if (theme === 'light') document.documentElement.classList.add('light-theme');

  window.addEventListener('storage', e => {
    if (e.key === 'tokku_theme') {
      if (e.newValue === 'light') document.documentElement.classList.add('light-theme');
      else document.documentElement.classList.remove('light-theme');
    }
  });
})();

function renderSidebar(activePage) {
  const navItems = [
    { href: 'laporan-dashboard.html', icon: 'bx-pie-chart-alt-2', label: '1. Laporan' },
    { href: 'keuangan.html',         icon: 'bx-wallet-alt',      label: '2. Kas Harian' },
    { href: 'transaksi.html',        icon: 'bx-list-ul',         label: '3. Riwayat Transaksi' },
    { href: 'stok.html',             icon: 'bx-stats',           label: '4. Stok' },
    { 
      section: '5. Products',
      items: [
        { href: 'produk.html',       icon: 'bx-package',         label: 'SKU Master' },
        { href: 'kategori.html',     icon: 'bx-folder-open',     label: 'Kategori' },
      ]
    },
    { href: 'retur.html',            icon: 'bx-undo',            label: '6. Retur' },
    { href: 'pelanggan.html',        icon: 'bx-group',           label: '7. Relasi' },
    { href: 'deposit.html',          icon: 'bx-credit-card',     label: '8. Deposit' },
    { href: 'utang-piutang.html',    icon: 'bx-transfer-alt',    label: '9. Utang dan Piutang' },
    { href: 'pembayaran.html',       icon: 'bx-money',           label: '10. Pembayaran' },
    { href: 'pengaturan.html',       icon: 'bx-cog',             label: '11. Master' },
    { section: 'POS' },
    { href: 'kasir.html',            icon: 'bx-receipt',         label: 'Kasir / POS', badge: 'HOT' },
  ];

  const navHTML = navItems.map(item => {
    if (item.section && !item.items) return `<div class="nav-section">${item.section}</div>`;
    if (item.section && item.items) {
      const subItems = item.items.map(sub => {
        const isActive = activePage === sub.href ? 'active' : '';
        return `<a href="${sub.href}" class="nav-item sub-item ${isActive}"><i class='bx ${sub.icon}'></i> ${sub.label}</a>`;
      }).join('');
      return `<div class="nav-section">${item.section}</div>${subItems}`;
    }
    const isActive = activePage === item.href ? 'active' : '';
    const badge = item.badge ? `<span class="nav-badge">${item.badge}</span>` : '';
    return `<a href="${item.href}" class="nav-item ${isActive}"><i class='bx ${item.icon}'></i> ${item.label}${badge}</a>`;
  }).join('');

  const user = getCurrentUser() || {};
  const name = user.full_name || user.email || 'User';
  const role = user.role || 'kasir';
  const roleLabel = { owner: 'Pemilik', admin: 'Admin', kasir: 'Kasir', stoker: 'Stoker' }[role] || role;
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

function toggleTheme() {
  const isLight = document.documentElement.classList.toggle('light-theme');
  const newTheme = isLight ? 'light' : 'dark';
  localStorage.setItem('tokku_theme', newTheme);
}
