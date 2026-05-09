# 🏪 KASIRKU — POS Toko Bangunan

Aplikasi Point of Sale modern berbasis web untuk toko bangunan. Dibangun dengan HTML/CSS/JS murni + Supabase sebagai backend.

---

## 🚀 Cara Menjalankan

### 1. Buka Langsung di Browser (Tanpa Build)

Buka `index.html` langsung di browser, atau gunakan ekstensi **Live Server** di VS Code.

> **Catatan:** Sebelum bisa login, Anda harus mengisi kredensial Supabase terlebih dahulu (lihat langkah di bawah).

### 2. Menggunakan Vite (Opsional, untuk Development)

```bash
npm install
npm run dev
```

---

## 🔧 Konfigurasi Supabase

### Langkah 1: Buat Proyek Supabase

1. Buka [https://supabase.com](https://supabase.com) dan buat akun
2. Klik **New Project** → isi nama dan password database
3. Tunggu proyek selesai dibuat (~2 menit)

### Langkah 2: Jalankan SQL Schema

1. Di dashboard Supabase, buka **SQL Editor**
2. Copy seluruh isi file `supabase_init.sql`
3. Paste dan klik **Run**

### Langkah 3: Isi Kredensial

**Cara A — Langsung di file `js/supabase.js`** (Disarankan untuk produksi):

```javascript
const SUPABASE_URL     = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIs...';
```

**Cara B — Via Pengaturan di Aplikasi** (untuk development):

1. Buka aplikasi → Login (akan error dulu)
2. Buka halaman **Pengaturan** → bagian **Koneksi Supabase**
3. Isi URL dan Anon Key → klik **Simpan Semua**
4. Reload halaman

**Cara C — Via `.env` (untuk Vite)**:

```bash
cp .env.example .env
# Edit .env dan isi URL + KEY
```

### Langkah 4: Dapatkan Kredensial

Di dashboard Supabase: **Settings** → **API**
- **Project URL** → masukkan ke `SUPABASE_URL`
- **anon public** → masukkan ke `SUPABASE_ANON_KEY`

---

## 📁 Struktur File

```
KASIRKU/
├── index.html              # Halaman login
├── manifest.json           # PWA manifest
├── .env.example            # Template environment variables
├── vite.config.js
├── css/
│   └── style.css           # Stylesheet utama
├── js/
│   ├── app.js              # ⭐ File utama (KasirkuDB, Toast, Modal, dll)
│   ├── supabase.js         # Konfigurasi Supabase client
│   ├── helpers.js          # Fungsi utilitas (formatRupiah, dll)
│   ├── receipt.js          # Generator struk cetak
│        # Konfigurasi Vite (jika digunakan)
├── pages/
│   ├── _sidebar.js         # Komponen sidebar (diload semua halaman)
│   ├── dashboard.html      # Dashboard utama
│   ├── kasir.html          # Kasir / POS
│   ├── transaksi.html      # Riwayat transaksi
│   ├── produk.html         # Manajemen produk
│   ├── kategori.html       # Manajemen kategori
│   ├── stok.html           # Monitor stok
│   ├── pelanggan.html      # Manajemen pelanggan
│   ├── laporan.html        # Laporan penjualan
│   ├── pengguna.html       # Manajemen user (owner only)
│   └── pengaturan.html     # Pengaturan toko
└── supabase_init.sql       # Schema database lengkap
```

---

## 👥 Role Pengguna

| Role    | Akses |
|---------|-------|
| **Owner**   | Semua fitur + manajemen user + pengaturan |
| **Manager** | Semua fitur kecuali manajemen user |
| **Kasir**   | Kasir, produk, transaksi, pelanggan |

---

## 🛠️ Teknologi

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **Charts:** Chart.js
- **Barcode:** html5-qrcode
- **PDF:** jsPDF + jsPDF-AutoTable

---

## ❓ Troubleshooting

**Login gagal / "Invalid API Key"**
→ Pastikan URL dan Anon Key Supabase sudah diisi dengan benar di `js/supabase.js`

**Halaman kosong / tidak ada data**
→ Pastikan SQL schema (`supabase_init.sql`) sudah dijalankan di Supabase

**Sidebar tidak muncul**
→ Pastikan `_sidebar.js` ada di folder `pages/` dan dipanggil setelah `app.js`

**RLS Error**
→ Buka Supabase → Authentication → Policies dan pastikan Row Level Security dikonfigurasi sesuai `supabase_init.sql`
"# Kasir" 
"# Kasirku" 
"# Kasirr" 
