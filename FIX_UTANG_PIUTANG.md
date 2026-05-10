# 🔧 FIX: Halaman Utang & Piutang Tidak Menampilkan Data

## ❌ Masalah
Halaman **Utang & Piutang** (`utang-piutang.html`) tidak menampilkan tabel/data hutang meskipun tidak ada error JavaScript.

## 🔍 Penyebab
RLS (Row Level Security) Policy di tabel `debts` terlalu ketat:
- Hanya user dengan role `owner` dan `manager` yang bisa melihat data
- User dengan role `cashier` tidak bisa akses tabel ini

## ✅ Solusi

### Opsi 1: Jalankan File SQL yang Sudah Disediakan

1. Buka **Supabase Dashboard** → **SQL Editor**
2. Copy paste isi file `rls_fix.sql` atau `rls_fix_debts.sql`
3. Klik **Run** untuk menjalankan query

### Opsi 2: Manual via SQL Editor

Jalankan query berikut di Supabase SQL Editor:

```sql
-- Hapus policy lama
DROP POLICY IF EXISTS "debts_select" ON public.debts;
DROP POLICY IF EXISTS "debts_insert" ON public.debts;
DROP POLICY IF EXISTS "debts_update" ON public.debts;
DROP POLICY IF EXISTS "debts_delete" ON public.debts;

-- Buat policy baru yang lebih fleksibel
CREATE POLICY "debts_select" ON public.debts
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "debts_insert" ON public.debts
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "debts_update" ON public.debts
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "debts_delete" ON public.debts
  FOR DELETE TO authenticated
  USING (get_user_role() IN ('owner', 'manager'));
```

## 📝 Penjelasan Policy Baru

- **SELECT**: Semua user yang login bisa melihat data (owner, manager, cashier)
- **INSERT**: Semua user bisa menambah catatan utang/piutang
- **UPDATE**: Semua user bisa update (untuk bayar cicilan)
- **DELETE**: Hanya owner & manager yang bisa menghapus data

## ✨ Hasil Setelah Fix

Setelah menjalankan SQL di atas:
- ✅ Tabel utang & piutang akan muncul
- ✅ Semua user bisa melihat dan mengelola data
- ✅ Summary cards akan menampilkan total utang & piutang
- ✅ Filter dan tab berfungsi normal

## 🚨 Catatan Penting

Pastikan tabel `debts` sudah dibuat dengan menjalankan `supabase_init.sql` terlebih dahulu.
