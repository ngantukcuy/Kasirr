// _sidebar.js — KASIRKU Sidebar Helpers
// Sidebar HTML sudah langsung ada di tiap halaman (tidak perlu inject via JS)

function getRoleLabel(role) {
  return { owner: 'Pemilik', manager: 'Manajer', kasir: 'Kasir' }[role] || role;
}

// Update user info di sidebar footer setelah auth
function updateSidebarUser() {
  const user = getCurrentUser();
  if (!user) return;
  const el = {
    name:   document.getElementById('user-name'),
    role:   document.getElementById('user-role'),
    avatar: document.getElementById('user-avatar'),
  };
  if (el.name)   el.name.textContent   = user.full_name || 'User';
  if (el.role)   el.role.textContent   = getRoleLabel(user.role || 'kasir');
  if (el.avatar) el.avatar.textContent = (user.full_name || 'U').charAt(0).toUpperCase();
}

async function handleLogout() {
  Modal.confirm('Keluar dari KASIRKU', 'Apakah Anda yakin ingin keluar?', async () => {
    try {
      await KasirkuDB.Auth.logout();
    } catch {
      localStorage.clear();
      window.location.href = '../index.html';
    }
  });
}

function openSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.add('mobile-open');
  if (overlay) overlay.style.display = 'block';
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.remove('mobile-open');
  if (overlay) overlay.style.display = 'none';
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  if (window.innerWidth <= 768) {
    sidebar.classList.contains('mobile-open') ? closeSidebar() : openSidebar();
  } else {
    sidebar.classList.toggle('collapsed');
    localStorage.setItem('sidebar_collapsed', sidebar.classList.contains('collapsed'));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('sidebar_collapsed') === 'true' && window.innerWidth > 768) {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.add('collapsed');
  }
});
