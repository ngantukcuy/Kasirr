# Tokku — ERP/POS Toko Bangunan

Platform ERP/POS modern yang dibangun khusus untuk toko bangunan Indonesia.

## Fitur Utama

- **Dashboard Analytics** — Grafik penjualan, statistik omzet, stok menipis
- **Kasir / POS** — Transaksi super cepat, scan barcode, multi pembayaran
- **Riwayat Transaksi** — Filter, detail invoice, export data
- **Produk & Stok** — Manajemen produk, stok adjustment, kategori 3 tingkat
- **Pelanggan** — Data pelanggan, tipe, limit hutang, deposit
- **Utang & Piutang** — Monitor hutang supplier & piutang pelanggan, bayar parsial
- **Keuangan & Kas** — Buka/tutup kas, catatan keuangan harian
- **Manajemen User** — Role-based access (Owner, Manager, Kasir, Stoker)
- **Laporan** — Laporan penjualan, stok, keuangan dengan export

## Teknologi

- **Frontend**: HTML5 + CSS3 + Vanilla JS (tanpa framework berat)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth + JWT
- **PWA**: Service Worker, installable di mobile/desktop

## Setup

1. Copy `.env.example` ke `.env`
2. Isi `SUPABASE_URL` dan `SUPABASE_ANON_KEY` dari dashboard Supabase
3. Jalankan SQL di `supabase_init.sql` untuk setup database
4. Deploy ke Vercel / Netlify / hosting apapun

## Desain

- Dark mode by default, light mode tersedia
- Responsive desktop & mobile
- Warna: Electric Blue (#2563eb) + Amber accent
- Font: Outfit (display) + Plus Jakarta Sans (body)
