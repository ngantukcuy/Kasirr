-- ============================================================
-- FIX ROOT CAUSE: Halaman Utang & Piutang tidak pernah bisa jalan
-- ============================================================
-- MASALAH SEBENARNYA:
-- supabase_init.sql membuat tabel bernama "debts_receivables" dengan
-- kolom: entity_id, remaining_balance, status (tanpa relasi ke customers/suppliers)
--
-- Tapi pages/utang-piutang.html query ke tabel "debts" (BEDA NAMA!)
-- dengan kolom: customer_id, supplier_id, amount, paid_amount, due_date
-- dan butuh join .select('*,customers(name),suppliers(name)')
--
-- Akibatnya: query dari frontend akan selalu gagal dengan error
-- "relation public.debts does not exist" — TIDAK PEDULI RLS policy-nya
-- diatur seperti apa. Ini kenapa rls_fix.sql & rls_fix_debts.sql tidak
-- pernah benar-benar menyelesaikan masalah (mereka menaruh policy di
-- tabel yang salah / tidak ada).
--
-- Jalankan file ini SETELAH supabase_init.sql. Aman dijalankan meski
-- tabel "debts" belum ada / sudah ada sebagian (pakai IF NOT EXISTS).
-- Anda BOLEH menghapus rls_fix.sql / rls_fix_debts.sql / FIX_UTANG_PIUTANG.md
-- setelah ini karena isinya sudah digantikan oleh file ini.
-- ============================================================

-- 0. WAJIB: fungsi ini dipakai di semua RLS policy (termasuk file-file fix
--    lama Anda) tapi TIDAK PERNAH dibuat di manapun di project ini. Tanpa
--    ini, setiap CREATE POLICY yang memakai get_user_role() akan gagal
--    dengan error "function get_user_role() does not exist" dan seluruh
--    script SQL Anda akan berhenti di situ — ini kemungkinan besar alasan
--    kenapa rls_fix.sql / rls_fix_debts.sql / patch_v12.sql tidak pernah
--    benar-benar berhasil diterapkan sebelumnya.
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 1. Buat tabel "debts" dengan kolom yang sesuai kebutuhan frontend
CREATE TABLE IF NOT EXISTS public.debts (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type           TEXT CHECK (type IN ('utang', 'piutang')) NOT NULL,
  customer_id    UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  supplier_id    UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  amount         DECIMAL(15,2) NOT NULL DEFAULT 0,
  paid_amount    DECIMAL(15,2) NOT NULL DEFAULT 0,
  due_date       DATE,
  reference_id   UUID,
  notes          TEXT,
  created_by     UUID REFERENCES public.profiles(id),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_debts_type        ON public.debts(type);
CREATE INDEX IF NOT EXISTS idx_debts_customer     ON public.debts(customer_id);
CREATE INDEX IF NOT EXISTS idx_debts_supplier      ON public.debts(supplier_id);
CREATE INDEX IF NOT EXISTS idx_debts_due_date      ON public.debts(due_date);

-- 2. Kalau ada data lama tersangkut di debts_receivables, pindahkan
--    (aman dijalankan meski debts_receivables kosong/tidak ada data cocok)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='debts_receivables') THEN
    INSERT INTO public.debts (type, amount, paid_amount, due_date, reference_id, created_at)
    SELECT type,
           amount,
           COALESCE(amount - remaining_balance, 0),
           due_date,
           reference_id,
           created_at
    FROM public.debts_receivables;
  END IF;
END $$;

-- 3. Enable RLS
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

-- 4. Policies (semua user login bisa lihat & input, hanya owner/manager bisa hapus)
DROP POLICY IF EXISTS "debts_select" ON public.debts;
DROP POLICY IF EXISTS "debts_insert" ON public.debts;
DROP POLICY IF EXISTS "debts_update" ON public.debts;
DROP POLICY IF EXISTS "debts_delete" ON public.debts;

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

-- 5. Tabel "stock_movements" — dipakai oleh laporan-stok.html, laporan-dashboard.html,
--    dan Products.adjustStock() di js/app.js, TAPI TIDAK PERNAH DIBUAT di supabase_init.sql
--    (yang ada cuma "stock_adjustments", beda tujuan — itu untuk stok opname/approval,
--    bukan log riwayat mutasi stok). Karena insert-nya "non-fatal" (dibungkus .catch),
--    aplikasi tidak error, tapi riwayat mutasi & laporan stok selalu kosong.
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id  UUID REFERENCES public.products(id) ON DELETE SET NULL,
  type        TEXT CHECK (type IN ('in', 'out', 'adjustment')) NOT NULL,
  quantity    DECIMAL(15,2) NOT NULL DEFAULT 0,
  notes       TEXT,
  created_by  UUID REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created  ON public.stock_movements(created_at);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stock_movements_select" ON public.stock_movements;
DROP POLICY IF EXISTS "stock_movements_insert" ON public.stock_movements;
DROP POLICY IF EXISTS "stock_movements_update" ON public.stock_movements;
DROP POLICY IF EXISTS "stock_movements_delete" ON public.stock_movements;

CREATE POLICY "stock_movements_select" ON public.stock_movements
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "stock_movements_insert" ON public.stock_movements
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "stock_movements_update" ON public.stock_movements
  FOR UPDATE TO authenticated USING (get_user_role() IN ('owner', 'manager'));
CREATE POLICY "stock_movements_delete" ON public.stock_movements
  FOR DELETE TO authenticated USING (get_user_role() IN ('owner', 'manager'));

-- 6. Tabel "transactions" — halaman kasir (pages/kasir.html) mengirim beberapa kolom
--    yang belum ada di schema (tax_amount, change_amount, points_used, points_earned,
--    notes untuk fitur poin loyalitas & catatan transaksi), dan CHECK constraint
--    payment_method cuma mengizinkan ('tunai','transfer','giro','deposit') padahal
--    tombol di kasir.html sebenarnya mengirim ('cash','qris','transfer','debit','kredit').
--    Tanpa fix ini, SETIAP transaksi penjualan di kasir akan gagal disimpan.
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS tax_amount     DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS change_amount  DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS points_used    INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS points_earned  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes          TEXT;

ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_payment_method_check;
ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_payment_method_check
  CHECK (payment_method IN ('cash', 'qris', 'transfer', 'debit', 'kredit', 'tunai', 'giro', 'deposit'));

-- SELESAI ✅
-- Setelah ini, buka halaman Utang & Piutang — data seharusnya muncul.
