-- ============================================================
-- FIX: RLS Policy untuk tabel DEBTS (Utang & Piutang)
-- Jalankan di Supabase Dashboard → SQL Editor
-- ============================================================

-- Hapus policy lama yang terlalu ketat
DROP POLICY IF EXISTS "debts_select" ON public.debts;
DROP POLICY IF EXISTS "debts_insert" ON public.debts;
DROP POLICY IF EXISTS "debts_update" ON public.debts;
DROP POLICY IF EXISTS "debts_delete" ON public.debts;

-- Buat policy baru yang lebih fleksibel
-- SELECT: semua authenticated user bisa lihat (owner, manager, cashier)
CREATE POLICY "debts_select" ON public.debts
  FOR SELECT TO authenticated
  USING (true);

-- INSERT: semua authenticated user bisa tambah data utang/piutang
CREATE POLICY "debts_insert" ON public.debts
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- UPDATE: semua authenticated user bisa update (untuk bayar cicilan)
CREATE POLICY "debts_update" ON public.debts
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE: hanya owner & manager yang bisa hapus
CREATE POLICY "debts_delete" ON public.debts
  FOR DELETE TO authenticated
  USING (get_user_role() IN ('owner', 'manager'));
