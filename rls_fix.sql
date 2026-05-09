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
