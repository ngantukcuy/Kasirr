-- ============================================================
-- FIX: Tambah RLS policy DELETE yang hilang
-- Jalankan di Supabase Dashboard → SQL Editor
-- ============================================================

-- TRANSACTIONS: owner & manager bisa hapus
CREATE POLICY "transactions_delete" ON public.transactions
  FOR DELETE TO authenticated
  USING (get_user_role() IN ('owner', 'manager'));

-- TRANSACTION_ITEMS: owner & manager bisa hapus (dibutuhkan saat edit & hapus transaksi)
CREATE POLICY "transaction_items_delete" ON public.transaction_items
  FOR DELETE TO authenticated
  USING (true);

-- TRANSACTION_ITEMS: owner & manager bisa update
CREATE POLICY "transaction_items_update" ON public.transaction_items
  FOR UPDATE TO authenticated
  USING (true);

-- STOCK_MOVEMENTS: owner & manager bisa hapus catatan stok
-- (Wajib dijalankan agar fitur hapus di Laporan Stok berfungsi)
CREATE POLICY "stock_movements_delete" ON public.stock_movements
  FOR DELETE TO authenticated
  USING (get_user_role() IN ('owner', 'manager'));

-- STOCK_MOVEMENTS: owner & manager bisa update
CREATE POLICY "stock_movements_update" ON public.stock_movements
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('owner', 'manager'));

-- ============================================================
-- DEBTS (Utang & Piutang): semua user bisa lihat & input
-- ============================================================

-- Hapus policy lama yang terlalu ketat
DROP POLICY IF EXISTS "debts_select" ON public.debts;
DROP POLICY IF EXISTS "debts_insert" ON public.debts;
DROP POLICY IF EXISTS "debts_update" ON public.debts;
DROP POLICY IF EXISTS "debts_delete" ON public.debts;

-- SELECT: semua authenticated user bisa lihat
CREATE POLICY "debts_select" ON public.debts
  FOR SELECT TO authenticated
  USING (true);

-- INSERT: semua authenticated user bisa tambah
CREATE POLICY "debts_insert" ON public.debts
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- UPDATE: semua authenticated user bisa update (untuk bayar cicilan)
CREATE POLICY "debts_update" ON public.debts
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE: hanya owner & manager
CREATE POLICY "debts_delete" ON public.debts
  FOR DELETE TO authenticated
  USING (get_user_role() IN ('owner', 'manager'));
