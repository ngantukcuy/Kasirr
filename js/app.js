// ============================================================
// KASIRKU — app.js  v17
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

// ── Toast ──
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

// ── Modal ──
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
    show(id) { const el = document.getElementById(id); if (el) { el.classList.add('active'); el.style.display = 'flex'; } },
    hide(id) { const el = document.getElementById(id); if (el) { el.classList.remove('active'); el.style.display = ''; } }
  };
})();

// ── Helpers ──
function formatCurrency(amount) {
  if (!amount && amount !== 0) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}
function formatRupiah(amount) { return formatCurrency(amount); }
function formatNumber(num) {
  if (!num && num !== 0) return '0';
  return new Intl.NumberFormat('id-ID').format(num);
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
function getToday() { return new Date().toISOString().split('T')[0]; }

// ── User cache ──
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

// updateSidebarUser — update avatar/name/role di sidebar setelah inject
function updateSidebarUser() {
  const user = getCurrentUser() || {};
  const name = user.full_name || user.email || 'User';
  const role = user.role || 'kasir';
  const roleLabel = { owner:'Pemilik', admin:'Admin', manager:'Manajer', kasir:'Kasir', stoker:'Stoker' }[role] || role;
  const initial = name.charAt(0).toUpperCase();
  const el = {
    avatar: document.getElementById('user-avatar'),
    name:   document.getElementById('user-name'),
    role:   document.getElementById('user-role'),
  };
  if (el.avatar) el.avatar.textContent = initial;
  if (el.name)   el.name.textContent   = name;
  if (el.role)   el.role.textContent   = roleLabel;
}

// ── KasirkuDB ──
const KasirkuDB = {

  // ── Auth ──
  Auth: {
    async login(email, password) {
      const { data, error } = await _sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const profile = await KasirkuDB.Auth._loadProfile(data.user.id, { email });
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
      try { const profile = await KasirkuDB.Auth._loadProfile(session.user.id, { email: session.user.email }); _saveUser(profile); } catch (e) { console.warn('[KASIRKU] Gagal memuat profil:', e.message); }
      return true;
    },
    async register(email, password, fullName, role = 'kasir') {
      const { data, error } = await _sb.auth.signUp({ email, password });
      if (error) throw error;
      if (data.user) {
        // Coba buat baris profil sekarang. Kalau gagal (mis. butuh verifikasi email dulu
        // sehingga belum ada sesi aktif), jangan gagalkan seluruh registrasi — _loadProfile
        // akan membuatnya otomatis (self-heal) saat login pertama kali berhasil.
        const { error: profileError } = await _sb.from('profiles').upsert({
          id: data.user.id, email, full_name: fullName, role,
        });
        if (profileError) console.warn('[KASIRKU] Profil belum bisa dibuat saat registrasi, akan dibuat otomatis saat login:', profileError.message);
      }
      return data;
    },
    async _loadProfile(userId, fallback) {
      const { data, error } = await _sb.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (error) throw error;
      if (data) return data;

      // Baris profil belum ada untuk user ini — buat otomatis (self-heal) memakai data
      // yang tersedia, supaya login/registrasi tidak gagal hanya karena profil kosong.
      fallback = fallback || {};
      const seed = {
        id: userId,
        email: fallback.email || '',
        full_name: fallback.full_name || (fallback.email ? fallback.email.split('@')[0] : 'Pengguna'),
        role: fallback.role || 'kasir',
      };
      const { data: created, error: createErr } = await _sb.from('profiles').upsert(seed).select().single();
      if (createErr) throw createErr;
      return created;
    }
  },

  // ── Products ──
  Products: {
    async getAll(filters = {}) {
      let q = _sb.from('products').select('*, categories(name)').eq('is_active', true).order('name');
      if (filters.search)      q = q.ilike('name', `%${filters.search}%`);
      if (filters.category_id) q = q.eq('category_id', filters.category_id);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    async getByBarcode(barcode) {
      const { data, error } = await _sb.from('products').select('*, categories(name)').eq('barcode', barcode).eq('is_active', true).single();
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
    },
    async adjustStock(productId, qty, type = 'in', notes = '') {
      // type: 'in' | 'out' | 'adjustment'
      const { data: product, error: fetchErr } = await _sb.from('products').select('stock').eq('id', productId).single();
      if (fetchErr) throw fetchErr;
      const newStock = type === 'in'
        ? (product.stock || 0) + qty
        : type === 'out'
          ? Math.max(0, (product.stock || 0) - qty)
          : qty; // adjustment = set absolute
      const { data, error } = await _sb.from('products').update({ stock: newStock }).eq('id', productId).select().single();
      if (error) throw error;
      // Log stock movement
      const user = getCurrentUser();
      await _sb.from('stock_movements').insert({
        product_id: productId,
        type,
        quantity: qty,
        notes,
        user_id: user?.id || null,
      }).then(() => {}).catch(() => {}); // non-fatal
      return data;
    }
  },

  // ── Categories ──
  Categories: {
    async getAll() {
      const { data, error } = await _sb.from('categories').select('*').order('name');
      if (error) throw error;
      return data || [];
    },
    async create(d) {
      const { data, error } = await _sb.from('categories').insert(d).select().single();
      if (error) throw error;
      return data;
    },
    async update(id, d) {
      const { data, error } = await _sb.from('categories').update(d).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    async delete(id) {
      const { error } = await _sb.from('categories').delete().eq('id', id);
      if (error) throw error;
    }
  },

  // ── Transactions ──
  Transactions: {
    async create(tx, items) {
      const { data, error } = await _sb.from('transactions').insert(tx).select().single();
      if (error) throw error;
      const txItems = items.map(it => ({ ...it, transaction_id: data.id }));
      const { error: itemErr } = await _sb.from('transaction_items').insert(txItems);
      if (itemErr) throw itemErr;
      return data;
    },
    async getAll(filters = {}) {
      let q = _sb.from('transactions')
        .select('*, customers(name), profiles!cashier_id(full_name)', { count: 'exact' })
        .order('created_at', { ascending: false });
      if (filters.search)    q = q.ilike('invoice_number', `%${filters.search}%`);
      if (filters.date_from) q = q.gte('created_at', filters.date_from);
      if (filters.date_to)   q = q.lte('created_at', filters.date_to + 'T23:59:59');
      if (filters.limit)     q = q.limit(filters.limit);
      if (filters.offset)    q = q.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
      const { data, error, count } = await q;
      if (error) throw error;
      return { data: data || [], count: count || 0 };
    },
    async getById(id) {
      const { data, error } = await _sb.from('transactions')
        .select('*, customers(name, phone, address), profiles!cashier_id(full_name), transaction_items(*, products(name, barcode))')
        .eq('id', id).single();
      if (error) throw error;
      return data;
    }
  },

  // ── Customers ──
  Customers: {
    async getAll(search = '') {
      let q = _sb.from('customers').select('*').order('name');
      if (search) q = q.ilike('name', `%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    async getById(id) {
      const { data, error } = await _sb.from('customers').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    async create(d) {
      const { data, error } = await _sb.from('customers').insert(d).select().single();
      if (error) throw error;
      return data;
    },
    async update(id, d) {
      const { data, error } = await _sb.from('customers').update(d).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
  },

  // ── Users (pengguna/master) ──
  Users: {
    async getAll() {
      const { data, error } = await _sb.from('profiles').select('*').order('full_name');
      if (error) throw error;
      return data || [];
    },
    async updateRole(id, role) {
      const { data, error } = await _sb.from('profiles').update({ role }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    async deactivate(id) {
      const { error } = await _sb.from('profiles').update({ is_active: false }).eq('id', id);
      if (error) throw error;
    },
    async activate(id) {
      const { error } = await _sb.from('profiles').update({ is_active: true }).eq('id', id);
      if (error) throw error;
    }
  },

  // ── Settings ──
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
      const allowed = ['store_name','store_address','store_phone','store_email','store_website','store_logo','receipt_footer','tax_percent','receipt_size'];
      const patch = {};
      allowed.forEach(k => { if (settings[k] !== undefined) patch[k] = settings[k]; });
      patch.updated_at = new Date().toISOString();
      const { data, error } = await _sb.from('profiles').update(patch).eq('id', session.user.id).select().single();
      if (error) throw error;
      return data;
    }
  },

  // ── StoreSettings (alias Settings — dipakai halaman kasir) ──
  StoreSettings: {
    async get() { return KasirkuDB.Settings.get(); },
    async update(d) { return KasirkuDB.Settings.update(d); }
  },

  // ── Expenses ──
  Expenses: {
    async getAll(filters = {}) {
      let q = _sb.from('expenses').select('*').order('created_at', { ascending: false });
      if (filters.date_from) q = q.gte('created_at', filters.date_from);
      if (filters.date_to)   q = q.lte('created_at', filters.date_to + 'T23:59:59');
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    async create(d) {
      const { data, error } = await _sb.from('expenses').insert(d).select().single();
      if (error) throw error;
      return data;
    }
  },

  // ── Cash Sessions (Kas Harian) ──
  CashSessions: {
    async getOpen(userId) {
      const { data, error } = await _sb.from('cash_sessions')
        .select('*').eq('user_id', userId).eq('status', 'open').single();
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
      return data || null;
    },
    async open(userId, openingBalance) {
      const { data, error } = await _sb.from('cash_sessions').insert({
        user_id: userId,
        opening_balance: openingBalance,
        status: 'open',
        opened_at: new Date().toISOString(),
      }).select().single();
      if (error) throw error;
      return data;
    },
    async close(sessionId, closingBalance, notes = '') {
      const { data, error } = await _sb.from('cash_sessions').update({
        closing_balance: closingBalance,
        status: 'closed',
        closed_at: new Date().toISOString(),
        notes,
      }).eq('id', sessionId).select().single();
      if (error) throw error;
      return data;
    }
  },

};

// ── Globals ──
window._sb = _sb;  // expose for pages that query directly
window.KasirkuDB   = KasirkuDB;
window.Toast       = Toast;
window.Modal       = Modal;
window.formatCurrency  = formatCurrency;
window.formatRupiah    = formatRupiah;
window.formatNumber    = formatNumber;
window.formatDate      = formatDate;
window.getToday        = getToday;
window.getCurrentUser  = getCurrentUser;
window.updateSidebarUser = updateSidebarUser;
window.requireAuth = async () => {
  const auth = await KasirkuDB.Auth.isAuthenticated();
  if (!auth) window.location.href = '../index.html';
  return auth;
};
