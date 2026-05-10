-- ============================================================
-- PATCH v12: PIN di Database + Sesi Kasir Harian
-- Jalankan ini di Supabase SQL Editor
-- ============================================================

-- 1. Tambah kolom pin_hash di profiles (opsional, backup PIN di DB)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pin_hash TEXT;

-- 2. Buat tabel kasir_sessions untuk mencatat modal awal harian
CREATE TABLE IF NOT EXISTS public.kasir_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cashier_id UUID REFERENCES public.profiles(id) NOT NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  opening_cash DECIMAL(15,2) NOT NULL DEFAULT 0,
  closing_cash DECIMAL(15,2),
  total_sales DECIMAL(15,2) DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  notes TEXT,
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  UNIQUE(cashier_id, session_date)
);

-- 3. Enable RLS
ALTER TABLE public.kasir_sessions ENABLE ROW LEVEL SECURITY;

-- 4. Policies
DROP POLICY IF EXISTS "kasir_sessions_select" ON public.kasir_sessions;
DROP POLICY IF EXISTS "kasir_sessions_insert" ON public.kasir_sessions;
DROP POLICY IF EXISTS "kasir_sessions_update" ON public.kasir_sessions;

CREATE POLICY "kasir_sessions_select" ON public.kasir_sessions
  FOR SELECT TO authenticated
  USING (cashier_id = auth.uid() OR get_user_role() IN ('owner', 'manager'));

CREATE POLICY "kasir_sessions_insert" ON public.kasir_sessions
  FOR INSERT TO authenticated
  WITH CHECK (cashier_id = auth.uid());

CREATE POLICY "kasir_sessions_update" ON public.kasir_sessions
  FOR UPDATE TO authenticated
  USING (cashier_id = auth.uid() OR get_user_role() IN ('owner', 'manager'));

-- 5. Index untuk performa
CREATE INDEX IF NOT EXISTS idx_kasir_sessions_date     ON public.kasir_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_kasir_sessions_cashier  ON public.kasir_sessions(cashier_id);

-- SELESAI ✅
