# Tokku v2 - Sistem ERP & POS Toko Bangunan

Tokku v2 adalah aplikasi Point of Sale (POS) dan Enterprise Resource Planning (ERP) yang dirancang khusus untuk toko bangunan. Aplikasi ini menggunakan teknologi web modern dengan Supabase sebagai backend.

## Fitur Unggulan

1.  **SKU Master**: Mendukung produk induk dan eceran dengan pengelolaan harga modal, jual minimum, dan jual standard.
2.  **Kas Harian**: Fitur buka/tutup kas untuk memantau mutasi uang di laci secara real-time.
3.  **Relasi**: Pengelolaan data pelanggan dan pemasok (supplier) dengan sistem limit hutang dan tempo pembayaran.
4.  **Deposit**: Pencatatan uang titipan pelanggan untuk transaksi yang lebih fleksibel.
5.  **Utang & Piutang**: Monitoring jatuh tempo dan pembayaran parsial.
6.  **Toko Digital**: Integrasi katalog online untuk pelanggan.

## Struktur Database (Supabase)

Semua skema database terbaru tersedia di file `supabase_init.sql`. Pastikan untuk menjalankan skrip tersebut di SQL Editor Supabase Anda.

### Tabel Utama:
- `profiles`: Data pengguna dan role.
- `products`: SKU Master (Induk & Eceran).
- `customers`: Data pelanggan & saldo deposit.
- `suppliers`: Data pemasok.
- `cash_sessions`: Sesi kas harian.
- `transactions`: Data penjualan.
- `debts_receivables`: Monitoring utang piutang.

## Cara Instalasi

1.  Clone project ini.
2.  Buka Supabase, buat project baru.
3.  Jalankan isi `supabase_init.sql` di SQL Editor.
4.  Copy URL dan Anon Key Supabase Anda ke `js/supabase.js` atau set melalui menu Pengaturan di aplikasi.
5.  Buka `index.html` melalui web server (misal: `npx serve .`).

## Role Pengguna
- **Owner**: Akses penuh ke semua fitur dan laporan.
- **Admin**: Pengelolaan data master dan keuangan.
- **Kasir**: Transaksi POS dan Kas Harian.
- **Stoker**: Pengelolaan stok dan inventori.
