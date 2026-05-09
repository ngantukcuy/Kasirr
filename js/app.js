// ============================================================
// KASIRKU — app.js
// File utama yang digunakan di semua halaman (non-module, UMD)
// Menyediakan: KasirkuDB, Toast, Modal, getCurrentUser, formatCurrency, getToday
// ============================================================

// ── Ambil Supabase client dari CDN UMD (sudah dimuat via <script> tag) ──
// v10 FIX: Gunakan __KASIRKU_READY__ promise agar session sudah di-restore
// sebelum query pertama jalan (mencegah 403 Forbidden)
const _sb = (() => {
  if (window.__SB_CLIENT__) return window.__SB_CLIENT__;
  const { createClient } = window.supabase || supabase;
  const SUPABASE_URL = window.__KASIRKU_URL__ || localStorage.getItem('__kasirku_sb_url') || 'https://fzuhmyzyraizizpxkltr.supabase.co';
  const SUPABASE_KEY = window.__KASIRKU_KEY__ || localStorage.getItem('__kasirku_sb_key') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dWhteXp5cmFpeml6cHhrbHRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMTQ0NTIsImV4cCI6MjA5Mzc5MDQ1Mn0.qy1_36YicMBg2-t4f4ynQnDX0kaOXBVauKf40RdedBI';
  const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'kasirku-auth-token' }
  });
  window.__SB_CLIENT__ = client;
  return client;
})();

// ── Guard: tunggu session siap sebelum query ──
// __KASIRKU_READY__ di-set oleh supabase.js setelah getSession() selesai
async function _waitReady() {
  if (window.__KASIRKU_READY__) await window.__KASIRKU_READY__;
}

// ============================================================
// Toast Notification
// ============================================================
const Toast = (() => {
  function _show(msg, type = 'info', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
      document.body.appendChild(container);
    }
    const colors = { success:'#22c55e', error:'#ef4444', warning:'#f59e0b', info:'#06b6d4' };
    const icons  = { success:'✓', error:'✕', warning:'⚠', info:'ℹ' };
    const toast  = document.createElement('div');
    toast.style.cssText = `
      display:flex;align-items:center;gap:10px;padding:12px 16px;
      background:#1c1f2a;border:1px solid rgba(255,255,255,0.08);
      border-left:3px solid ${colors[type]};border-radius:10px;
      color:#f1f5f9;font-size:0.875rem;font-family:inherit;
      box-shadow:0 8px 32px rgba(0,0,0,0.4);max-width:340px;
      animation:slideIn .25s ease;
    `;
    toast.innerHTML = `<span style="color:${colors[type]};font-weight:700;">${icons[type]}</span><span>${msg}</span>`;
    if (!document.getElementById('toast-style')) {
      const s = document.createElement('style');
      s.id = 'toast-style';
      s.textContent = '@keyframes slideIn{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}';
      document.head.appendChild(s);
    }
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity='0'; toast.style.transition='opacity .3s'; setTimeout(() => toast.remove(), 300); }, duration);
  }
  return {
    success: (m, d) => _show(m, 'success', d),
    error:   (m, d) => _show(m, 'error',   d),
    warning: (m, d) => _show(m, 'warning', d),
    info:    (m, d) => _show(m, 'info',    d),
  };
})();

// ============================================================
// Modal (confirm / alert)
// ============================================================
const Modal = (() => {
  function _render(title, body, actions) {
    document.getElementById('kasirku-modal')?.remove();
    const el = document.createElement('div');
    el.id = 'kasirku-modal';
    el.style.cssText = 'position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);';
    el.innerHTML = `
      <div style="background:#1c1f2a;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:28px 24px;width:100%;max-width:420px;margin:16px;box-shadow:0 24px 64px rgba(0,0,0,0.5);">
        <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:8px;color:#f1f5f9;">${title}</h3>
        <p style="color:#94a3b8;font-size:0.875rem;line-height:1.6;margin-bottom:20px;">${body}</p>
        <div style="display:flex;gap:8px;justify-content:flex-end;">${actions}</div>
      </div>`;
    document.body.appendChild(el);
    el.addEventListener('click', e => { if (e.target === el) el.remove(); });
    return el;
  }
  return {
    confirm(title, body, onOk, onCancel) {
      const el = _render(title, body, `
        <button id="modal-cancel" style="padding:8px 18px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:transparent;color:#94a3b8;cursor:pointer;font-family:inherit;font-size:0.875rem;">Batal</button>
        <button id="modal-ok"     style="padding:8px 18px;border-radius:8px;border:none;background:#f97316;color:#fff;cursor:pointer;font-family:inherit;font-size:0.875rem;font-weight:600;">Ya, Lanjutkan</button>
      `);
      el.querySelector('#modal-cancel').onclick = () => { el.remove(); onCancel?.(); };
      el.querySelector('#modal-ok').onclick     = () => { el.remove(); onOk?.(); };
    },
    alert(title, body, onOk) {
      const el = _render(title, body, `<button id="modal-ok" style="padding:8px 18px;border-radius:8px;border:none;background:#f97316;color:#fff;cursor:pointer;font-family:inherit;font-size:0.875rem;font-weight:600;">OK</button>`);
      el.querySelector('#modal-ok').onclick = () => { el.remove(); onOk?.(); };
    },
    close() { document.getElementById('kasirku-modal')?.remove(); },
    // CSS-class modal helpers (dipakai di kasir.html)
    show(id) {
      const el = document.getElementById(id);
      if (el) { el.classList.add('active'); el.style.display = 'flex'; }
    },
    hide(id) {
      const el = document.getElementById(id);
      if (el) { el.classList.remove('active'); el.style.display = ''; }
    }
  };
})();

// ============================================================
// Utilitas Global
// ============================================================
function formatCurrency(amount) {
  if (!amount && amount !== 0) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

// Alias formatRupiah → formatCurrency (dipakai di banyak halaman)
function formatRupiah(amount) { return formatCurrency(amount); }

function formatNumber(num) {
  return new Intl.NumberFormat('id-ID').format(num || 0);
}

function formatDate(date, fmt = 'short') {
  if (!date) return '-';
  const d = new Date(date);
  const opts = {
    short:    { day:'2-digit', month:'2-digit', year:'numeric' },
    long:     { day:'long', month:'long', year:'numeric' },
    datetime: { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' },
    time:     { hour:'2-digit', minute:'2-digit' },
  };
  return d.toLocaleDateString('id-ID', opts[fmt] || opts.short);
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function debounce(fn, delay = 300) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

function generateBarcode() {
  return `KB${Date.now().toString().slice(-8)}${Math.floor(Math.random()*9999).toString().padStart(4,'0')}`;
}

function exportToCSV(data, filename) {
  if (!data?.length) return;
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(r => Object.values(r).map(v => typeof v === 'string' ? `"${v.replace(/"/g,'""')}"` : v).join(','));
  const blob = new Blob(['\ufeff' + [headers, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${filename}.csv`;
  a.click();
}

function getStockStatus(stock, minStock) {
  if (stock <= 0) return { label:'Habis',    cls:'stock-empty' };
  if (stock <= minStock) return { label:'Kritis',   cls:'stock-low' };
  if (stock <= minStock * 2) return { label:'Sedikit',  cls:'stock-warning' };
  return { label:'Tersedia', cls:'stock-ok' };
}

function getTierBadge(tier) {
  return ({ regular:{label:'Regular',color:'#6b7280',icon:'👤'}, silver:{label:'Silver',color:'#94a3b8',icon:'🥈'}, gold:{label:'Gold',color:'#f59e0b',icon:'🥇'}, platinum:{label:'Platinum',color:'#a78bfa',icon:'💎'} })[tier] || {label:'Regular',color:'#6b7280',icon:'👤'};
}

function calculateLoyaltyPoints(totalAmount, tier = 'regular') {
  return Math.floor((totalAmount / 10000) * ({regular:1,silver:2,gold:3,platinum:5}[tier]||1));
}

// ============================================================
// Sesi & Profil User
// ============================================================
let _cachedUser = null;

function getCurrentUser() {
  try { return _cachedUser || JSON.parse(localStorage.getItem('kasirku_user') || 'null'); }
  catch { return null; }
}

function _saveUser(user) {
  _cachedUser = user;
  if (user) localStorage.setItem('kasirku_user', JSON.stringify(user));
  else localStorage.removeItem('kasirku_user');
}

// ============================================================
// KasirkuDB — wrapper semua operasi Supabase
// ============================================================
const KasirkuDB = {

  // ── Auth ────────────────────────────────────────────────
  Auth: {
    async login(email, password) {
      const { data, error } = await _sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Ambil profil
      const profile = await KasirkuDB.Auth._loadProfile(data.user.id);
      _saveUser(profile);
      return data;
    },

    async register(email, password, fullName, role = 'kasir') {
      const { data, error } = await _sb.auth.signUp({
        email, password,
        options: {
          data: { full_name: fullName, role },
          emailRedirectTo: window.location.origin + '/index.html'
        }
      });
      if (error) throw error;
      return data;
    },

    async logout() {
      await _sb.auth.signOut();
      _saveUser(null);
      window.location.href = (window.location.pathname.includes('/pages/') ? '../' : '') + 'index.html';
    },

    async isAuthenticated() {
      // v10 FIX: tunggu session di-restore dulu sebelum cek
      await _waitReady();
      const { data: { session } } = await _sb.auth.getSession();
      if (!session) return false;
      // Refresh cache
      try {
        const profile = await KasirkuDB.Auth._loadProfile(session.user.id);
        _saveUser(profile);
      } catch {}
      return true;
    },

    async _loadProfile(userId) {
      const { data, error } = await _sb.from('profiles').select('*').eq('id', userId).single();
      if (error || !data) {
        // fallback minimal dari auth user
        const { data: { user } } = await _sb.auth.getUser();
        return { id: userId, full_name: user?.user_metadata?.full_name || 'User', role: user?.user_metadata?.role || 'kasir', email: user?.email };
      }
      return data;
    },

    async getProfile() {
      const { data: { user } } = await _sb.auth.getUser();
      if (!user) return null;
      return KasirkuDB.Auth._loadProfile(user.id);
    },

    async updateProfile(updates) {
      const user = getCurrentUser();
      const { data, error } = await _sb.from('profiles').update(updates).eq('id', user.id).select().single();
      if (error) throw error;
      _saveUser({ ...user, ...data });
      return data;
    },

    async changePassword(newPassword) {
      const { error } = await _sb.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },

    async resetPassword(email) {
      const { error } = await _sb.auth.resetPasswordForEmail(email);
      if (error) throw error;
    }
  },

  // ── Products ────────────────────────────────────────────
  Products: {
    async getAll(filters = {}) {
      let q = _sb.from('products').select('*, categories(name, icon, color)').eq('is_active', true).order('name');
      if (filters.category_id) q = q.eq('category_id', filters.category_id);
      if (filters.search)      q = q.ilike('name', `%${filters.search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },

    async getById(id) {
      const { data, error } = await _sb.from('products').select('*, categories(name, icon, color)').eq('id', id).single();
      if (error) throw error;
      return data;
    },

    async getByBarcode(barcode) {
      const { data, error } = await _sb.from('products').select('*, categories(name, icon, color)').eq('barcode', barcode).eq('is_active', true).single();
      if (error) throw error;
      return data;
    },

    async create(productData) {
      const { data, error } = await _sb.from('products').insert(productData).select().single();
      if (error) throw error;
      return data;
    },

    async update(id, productData) {
      const { data, error } = await _sb.from('products').update(productData).eq('id', id).select('*').single();
      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('406') || error.details?.includes('0 rows')) {
          throw new Error('Akses ditolak: Pastikan role akun Anda adalah owner atau manager untuk mengedit produk.');
        }
        throw error;
      }
      return data;
    },

    async delete(id) {
      const { error } = await _sb.from('products').update({ is_active: false }).eq('id', id);
      if (error) throw error;
    },

    async adjustStock(productId, quantity, type, notes, userId) {
      const { data: prod } = await _sb.from('products').select('stock').eq('id', productId).single();
      const before = prod.stock;
      const after  = type === 'in' ? before + quantity : before - quantity;
      await _sb.from('products').update({ stock: after }).eq('id', productId);
      await _sb.from('stock_movements').insert({
        product_id: productId, type, quantity,
        before_stock: before, after_stock: after,
        reference_type: 'manual', notes, created_by: userId
      });
      return after;
    },

    async getLowStock() {
      const { data, error } = await _sb.from('low_stock_products').select('*');
      if (error) throw error;
      return data || [];
    }
  },

  // ── Categories ──────────────────────────────────────────
  Categories: {
    async getAll() {
      const { data, error } = await _sb.from('categories').select('*').eq('is_active', true).order('name');
      if (error) throw error;
      return data;
    },

    async create(d) {
      const { data, error } = await _sb.from('categories').insert(d).select().single();
      if (error) throw error;
      return data;
    },

    async update(id, d) {
      const { data, error } = await _sb.from('categories').update(d).eq('id', id).select('*').single();
      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('406')) {
          throw new Error('Akses ditolak: Hanya owner atau manager yang dapat mengedit kategori.');
        }
        throw error;
      }
      return data;
    },

    async delete(id) {
      const { error } = await _sb.from('categories').update({ is_active: false }).eq('id', id);
      if (error) throw error;
    }
  },

  // ── Transactions ────────────────────────────────────────
  Transactions: {
    async create(txData, items) {
      const user = getCurrentUser();
      // Generate nomor invoice
      let invoiceNumber;
      try {
        const { data } = await _sb.rpc('generate_invoice_number');
        invoiceNumber = data;
      } catch {
        invoiceNumber = `INV-${Date.now()}`;
      }

      const { data: tx, error: txErr } = await _sb.from('transactions')
        .insert({ ...txData, invoice_number: invoiceNumber, cashier_id: txData.cashier_id || user?.id })
        .select().single();
      if (txErr) throw txErr;

      const itemsData = items.map(i => ({ ...i, transaction_id: tx.id }));
      const { error: itemsErr } = await _sb.from('transaction_items').insert(itemsData);
      if (itemsErr) throw itemsErr;

      return tx;
    },

    async getAll(filters = {}) {
      let q = _sb.from('transactions')
        .select('*, profiles!cashier_id(full_name), customers(name, phone)')
        .order('created_at', { ascending: false });
      const startDate = filters.startDate || filters.date_from;
      const endDate   = filters.endDate   || filters.date_to;
      if (startDate) q = q.gte('created_at', startDate);
      if (endDate)   q = q.lte('created_at', endDate);
      if (filters.cashier_id)     q = q.eq('cashier_id', filters.cashier_id);
      if (filters.payment_method) q = q.eq('payment_method', filters.payment_method);
      if (filters.limit)          q = q.limit(filters.limit);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },

    async getById(id) {
      const { data, error } = await _sb.from('transactions')
        .select('*, profiles!cashier_id(full_name), customers(name, phone, address), transaction_items(*, products(name, unit))')
        .eq('id', id).single();
      if (error) throw error;
      return data;
    },

    async getReport(startDate, endDate) {
      const { data, error } = await _sb.from('daily_sales_summary').select('*')
        .gte('sale_date', startDate).lte('sale_date', endDate).order('sale_date');
      if (error) throw error;
      return data || [];
    },

    async getTopProducts(limit = 10) {
      const { data, error } = await _sb.from('top_selling_products').select('*').limit(limit);
      if (error) throw error;
      return data || [];
    },

    async void(id, reason) {
      const { error } = await _sb.from('transactions').update({ status: 'void', void_reason: reason }).eq('id', id);
      if (error) throw error;
    }
  },

  // ── Customers ───────────────────────────────────────────
  Customers: {
    async getAll(search = '') {
      let q = _sb.from('customers').select('*').eq('is_active', true).order('name');
      if (search) q = q.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },

    async getById(id) {
      const { data, error } = await _sb.from('customers')
        .select('*, transactions(id, total_amount, created_at, payment_method)')
        .eq('id', id).single();
      if (error) throw error;
      return data;
    },

    async create(d) {
      const { data, error } = await _sb.from('customers').insert(d).select().single();
      if (error) throw error;
      return data;
    },

    async update(id, d) {
      const { data, error } = await _sb.from('customers').update(d).eq('id', id).select('*').single();
      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('406')) {
          throw new Error('Akses ditolak: Hanya owner atau manager yang dapat mengedit pelanggan.');
        }
        throw error;
      }
      return data;
    },

    async delete(id) {
      const { error } = await _sb.from('customers').update({ is_active: false }).eq('id', id);
      if (error) throw error;
    }
  },

  // ── Stock Movements ─────────────────────────────────────
  StockMovements: {
    async getAll(productId = null, limit = 50) {
      let q = _sb.from('stock_movements')
        .select('*, products(name, unit), profiles!created_by(full_name)')
        .order('created_at', { ascending: false }).limit(limit);
      if (productId) q = q.eq('product_id', productId);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    }
  },

  // ── Reports / Expenses ──────────────────────────────────
  Reports: {
    async getSalesReport(startDate, endDate) {
      const { data, error } = await _sb.from('transactions')
        .select('id, invoice_number, total_amount, discount_amount, payment_method, created_at, profiles!cashier_id(full_name), customers(name), transaction_items(quantity, subtotal, product_name)')
        .gte('created_at', startDate).lte('created_at', endDate).eq('payment_status', 'paid').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },

    async getExpenses(startDate, endDate) {
      const { data, error } = await _sb.from('expenses')
        .select('*, profiles!created_by(full_name)').gte('date', startDate).lte('date', endDate).order('date', { ascending: false });
      if (error) throw error;
      return data || [];
    },

    async addExpense(d) {
      const { data, error } = await _sb.from('expenses').insert(d).select().single();
      if (error) throw error;
      return data;
    }
  },

  // ── Pengaturan Toko ─────────────────────────────────────
  Settings: {
    async get() {
      const { data, error } = await _sb.from('store_settings').select('*').limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data || { store_name: 'Toko Bangunan Kami', store_address: '', store_phone: '', store_logo: '', tax_percent: 0, receipt_footer: 'Terima kasih telah berbelanja!' };
    },

    async update(settings) {
      // upsert
      const { data, error } = await _sb.from('store_settings').upsert(settings).select().single();
      if (error) throw error;
      return data;
    }
  },

  // ── Users (owner only) ──────────────────────────────────
  Users: {
    async getAll() {
      const { data, error } = await _sb.from('profiles').select('*').order('full_name');
      if (error) throw error;
      return data || [];
    },

    async updateRole(userId, role) {
      const { error } = await _sb.from('profiles').update({ role }).eq('id', userId);
      if (error) throw error;
    },

    async deactivate(userId) {
      const { error } = await _sb.from('profiles').update({ is_active: false }).eq('id', userId);
      if (error) throw error;
    }
  }
};

// ============================================================
// Auth Guard — dipanggil di setiap halaman dalam /pages/
// ============================================================
async function requireAuth(activePage) {
  const auth = await KasirkuDB.Auth.isAuthenticated();
  if (!auth) {
    window.location.href = '../index.html';
    return false;
  }
  // Update user info di sidebar (sidebar sudah langsung ada di HTML)
  if (typeof updateSidebarUser === 'function') updateSidebarUser();
  return true;
}

// ============================================================
// Expose globals
// ============================================================
window.KasirkuDB      = KasirkuDB;
window.Toast          = Toast;
window.Modal          = Modal;
window.getCurrentUser = getCurrentUser;
window.formatCurrency = formatCurrency;
window.formatRupiah   = formatRupiah;
window.formatNumber   = formatNumber;
window.formatDate     = formatDate;
window.getToday       = getToday;
window.debounce       = debounce;
window.generateBarcode = generateBarcode;
window.exportToCSV    = exportToCSV;
window.getStockStatus = getStockStatus;
window.getTierBadge   = getTierBadge;
window.calculateLoyaltyPoints = calculateLoyaltyPoints;
window.requireAuth    = requireAuth;