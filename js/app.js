// ============================================================
// KASIRKU — app.js
// File utama yang digunakan di semua halaman (non-module, UMD)
// Menyediakan: KasirkuDB, Toast, Modal, getCurrentUser, formatCurrency, getToday
// ============================================================

const _sb = (() => {
  if (window.__SB_CLIENT__) return window.__SB_CLIENT__;
  const { createClient } = window.supabase || supabase;
  const SUPABASE_URL = window.__KASIRKU_URL__ || localStorage.getItem('__kasirku_sb_url') || 'https://fzuhmyzyraizizpxkltr.supabase.co';
  const SUPABASE_KEY = window.__KASIRKU_KEY__ || localStorage.getItem('__kasirku_sb_key') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dWhteXp5cmFpeml6cHhrbHRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMTQ0NTIsImV4cCI6MjA5Mzc5MDQ1Mn0.qy1_36YicMBg2-t4f4ynQnDX0kaOXBVauKf40RdedBI';
  const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'tokku-auth-token' }
  });
  window.__SB_CLIENT__ = client;
  return client;
})();

async function _waitReady() {
  if (window.__KASIRKU_READY__) await window.__KASIRKU_READY__;
}

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

const Modal = (() => {
  function _render(title, body, actions) {
    document.getElementById('kasirku-modal')?.remove();
    const el = document.createElement('div');
    el.id = 'kasirku-modal';
    el.style.cssText = 'position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);';
    el.innerHTML = `
      <div style="background:#1c1f2a;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:28px 24px;width:100%;max-width:420px;margin:16px;box-shadow:0 24px 64px rgba(0,0,0,0.5);">
        <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:8px;color:#f1f5f9;">${title}</h3>
        <div style="color:#94a3b8;font-size:0.875rem;line-height:1.6;margin-bottom:20px;">${body}</div>
        <div style="display:flex;gap:8px;justify-content:flex-end;">${actions}</div>
      </div>`;
    document.body.appendChild(el);
    return el;
  }
  return {
    confirm(title, body, onOk, onCancel) {
      const el = _render(title, body, `
        <button id="modal-cancel" style="padding:8px 18px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:transparent;color:#94a3b8;cursor:pointer;font-family:inherit;font-size:0.875rem;">Batal</button>
        <button id="modal-ok"     style="padding:8px 18px;border-radius:8px;border:none;background:#7af957;color:#0a0b0f;cursor:pointer;font-family:inherit;font-size:0.875rem;font-weight:600;">Ya, Lanjutkan</button>
      `);
      el.querySelector('#modal-cancel').onclick = () => { el.remove(); onCancel?.(); };
      el.querySelector('#modal-ok').onclick     = () => { el.remove(); onOk?.(); };
    },
    alert(title, body, onOk) {
      const el = _render(title, body, `<button id="modal-ok" style="padding:8px 18px;border-radius:8px;border:none;background:#7af957;color:#0a0b0f;cursor:pointer;font-family:inherit;font-size:0.875rem;font-weight:600;">OK</button>`);
      el.querySelector('#modal-ok').onclick = () => { el.remove(); onOk?.(); };
    },
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

function formatCurrency(amount) {
  if (!amount && amount !== 0) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function formatRupiah(amount) { return formatCurrency(amount); }

function formatDate(date, fmt = 'short') {
  if (!date) return '-';
  const d = new Date(date);
  const opts = {
    short:    { day:'2-digit', month:'2-digit', year:'numeric' },
    long:     { day:'long', month:'long', year:'numeric' },
    datetime: { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' },
  };
  return d.toLocaleDateString('id-ID', opts[fmt] || opts.short);
}

function getToday() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

let _cachedUser = null;
function getCurrentUser() {
  try { return _cachedUser || JSON.parse(localStorage.getItem('tokku_user') || 'null'); }
  catch { return null; }
}

function _saveUser(user) {
  _cachedUser = user;
  if (user) localStorage.setItem('tokku_user', JSON.stringify(user));
  else localStorage.removeItem('tokku_user');
}

const KasirkuDB = {
  Auth: {
    async login(email, password) {
      const { data, error } = await _sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const profile = await KasirkuDB.Auth._loadProfile(data.user.id);
      _saveUser(profile);
      return data;
    },
    async logout() {
      await _sb.auth.signOut();
      _saveUser(null);
      window.location.href = (window.location.pathname.includes('/pages/') ? '../' : '') + 'index.html';
    },
    async isAuthenticated() {
      await _waitReady();
      const { data: { session } } = await _sb.auth.getSession();
      if (!session) return false;
      try {
        const profile = await KasirkuDB.Auth._loadProfile(session.user.id);
        _saveUser(profile);
      } catch {}
      return true;
    },
    async register(email, password, fullName, role = 'kasir') {
      const { data, error } = await _sb.auth.signUp({ email, password });
      if (error) throw error;
      // Buat profil di tabel profiles setelah signup
      if (data.user) {
        const { error: profileError } = await _sb.from('profiles').upsert({
          id:        data.user.id,
          email:     email,
          full_name: fullName,
          role:      role,
        });
        if (profileError) throw profileError;
      }
      return data;
    },
    async _loadProfile(userId) {
      const { data, error } = await _sb.from('profiles').select('*').eq('id', userId).single();
      if (error) throw error;
      return data;
    }
  },

  Products: {
    async getAll(filters = {}) {
      let q = _sb.from('products').select('*, categories(name)').eq('is_active', true).order('name');
      if (filters.search) q = q.ilike('name', `%${filters.search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    async create(d) {
      const { data, error } = await _sb.from('products').insert(d).select().single();
      if (error) throw error;
      return data;
    },
    async update(id, d) {
      const { data, error } = await _sb.from('products').update(d).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    async delete(id) {
      const { error } = await _sb.from('products').update({ is_active: false }).eq('id', id);
      if (error) throw error;
    }
  },

  Transactions: {
    async create(tx, items) {
      const { data, error } = await _sb.from('transactions').insert(tx).select().single();
      if (error) throw error;
      const txItems = items.map(it => ({ ...it, transaction_id: data.id }));
      const { error: itemErr } = await _sb.from('transaction_items').insert(txItems);
      if (itemErr) throw itemErr;
      return data;
    },
    async getAll() {
      const { data, error } = await _sb.from('transactions').select('*, customers(name), profiles!cashier_id(full_name)').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  },

  Customers: {
    async getAll() {
      const { data, error } = await _sb.from('customers').select('*').eq('is_active', true).order('name');
      if (error) throw error;
      return data;
    },
    async create(d) {
      const { data, error } = await _sb.from('customers').insert(d).select().single();
      if (error) throw error;
      return data;
    }
  },

  Settings: {
    async get() {
      await _waitReady();
      const { data: { session } } = await _sb.auth.getSession();
      if (!session) throw new Error('Tidak ada sesi aktif');
      const { data, error } = await _sb.from('profiles').select('*').eq('id', session.user.id).single();
      if (error) throw error;
      return data;
    },
    async update(settings) {
      await _waitReady();
      const { data: { session } } = await _sb.auth.getSession();
      if (!session) throw new Error('Tidak ada sesi aktif');
      const allowed = ['store_name','store_address','store_phone','store_logo','receipt_footer','tax_percent','receipt_size'];
      const patch = {};
      allowed.forEach(k => { if (settings[k] !== undefined) patch[k] = settings[k]; });
      patch.updated_at = new Date().toISOString();
      const { data, error } = await _sb.from('profiles').update(patch).eq('id', session.user.id).select().single();
      if (error) throw error;
      return data;
    }
  },

  Expenses: {
    async getAll() {
      const { data, error } = await _sb.from('expenses').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    async create(d) {
      const { data, error } = await _sb.from('expenses').insert(d).select().single();
      if (error) throw error;
      return data;
    }
  }
};

window.KasirkuDB = KasirkuDB;
window.Toast = Toast;
window.Modal = Modal;
window.formatCurrency = formatCurrency;
window.formatRupiah = formatRupiah;
window.formatDate = formatDate;
window.getToday = getToday;
window.getCurrentUser = getCurrentUser;
window.requireAuth = async () => {
  const auth = await KasirkuDB.Auth.isAuthenticated();
  if (!auth) window.location.href = '../index.html';
  return auth;
};
