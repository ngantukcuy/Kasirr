-- ============================================================
-- FIX: RLS aktif tapi POLICY-nya nol di hampir semua tabel
-- ============================================================
-- MASALAH:
-- Dari seluruh file .sql di project ini, cuma tabel profiles, debts,
-- stock_movements, kasir_sessions yang benar-benar di-ENABLE RLS +
-- dikasih policy lengkap. Tabel transactions/transaction_items cuma
-- dikasih policy DELETE/UPDATE, tanpa SELECT/INSERT.
--
-- Sisanya — branches, brands, categories, suppliers, customers,
-- products, cash_sessions, stock_adjustments, returns, expenses,
-- store_configs — RLS-nya aktif (default Supabase saat bikin tabel
-- lewat Table Editor / toggle "Enable RLS") TAPI TIDAK PUNYA POLICY
-- SAMA SEKALI. RLS aktif + policy nol = akses diblokir total, diam-diam
-- (untuk SELECT biasa hasilnya array kosong; untuk .single()/.maybeSingle()
-- hasilnya error 406). Ini kenapa hampir semua halaman kosong dan
-- console penuh 406 — bukan cuma di halaman login/profil.
--
-- Jalankan file ini SETELAH rls_fix_profiles.sql, di Supabase Dashboard
-- → SQL Editor. Aman dijalankan berkali-kali.
-- ============================================================

-- Pastikan get_user_role() ada (dipakai buat cek owner/manager di bawah)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Helper: aktifkan RLS di semua tabel yang masih polos
ALTER TABLE public.branches          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_configs     ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- BRANCHES — data cabang. Semua staff boleh lihat, cuma owner/manager
-- yang boleh tambah/ubah/hapus.
-- ============================================================
DROP POLICY IF EXISTS "branches_select" ON public.branches;
DROP POLICY IF EXISTS "branches_write"  ON public.branches;
CREATE POLICY "branches_select" ON public.branches FOR SELECT TO authenticated USING (true);
CREATE POLICY "branches_write"  ON public.branches FOR ALL    TO authenticated
  USING (get_user_role() IN ('owner','manager')) WITH CHECK (get_user_role() IN ('owner','manager'));

-- ============================================================
-- BRANDS & CATEGORIES — master data produk. Semua staff boleh
-- lihat & tambah, cuma owner/manager yang boleh hapus.
-- ============================================================
DROP POLICY IF EXISTS "brands_select" ON public.brands;
DROP POLICY IF EXISTS "brands_insert" ON public.brands;
DROP POLICY IF EXISTS "brands_update" ON public.brands;
DROP POLICY IF EXISTS "brands_delete" ON public.brands;
CREATE POLICY "brands_select" ON public.brands FOR SELECT TO authenticated USING (true);
CREATE POLICY "brands_insert" ON public.brands FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "brands_update" ON public.brands FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "brands_delete" ON public.brands FOR DELETE TO authenticated USING (get_user_role() IN ('owner','manager'));

DROP POLICY IF EXISTS "categories_select" ON public.categories;
DROP POLICY IF EXISTS "categories_insert" ON public.categories;
DROP POLICY IF EXISTS "categories_update" ON public.categories;
DROP POLICY IF EXISTS "categories_delete" ON public.categories;
CREATE POLICY "categories_select" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "categories_insert" ON public.categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "categories_update" ON public.categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "categories_delete" ON public.categories FOR DELETE TO authenticated USING (get_user_role() IN ('owner','manager'));

-- ============================================================
-- SUPPLIERS & CUSTOMERS — sama pola: semua staff select/insert/update,
-- delete cuma owner/manager.
-- ============================================================
DROP POLICY IF EXISTS "suppliers_select" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_insert" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_update" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_delete" ON public.suppliers;
CREATE POLICY "suppliers_select" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "suppliers_insert" ON public.suppliers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "suppliers_update" ON public.suppliers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "suppliers_delete" ON public.suppliers FOR DELETE TO authenticated USING (get_user_role() IN ('owner','manager'));

DROP POLICY IF EXISTS "customers_select" ON public.customers;
DROP POLICY IF EXISTS "customers_insert" ON public.customers;
DROP POLICY IF EXISTS "customers_update" ON public.customers;
DROP POLICY IF EXISTS "customers_delete" ON public.customers;
CREATE POLICY "customers_select" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "customers_insert" ON public.customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "customers_update" ON public.customers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "customers_delete" ON public.customers FOR DELETE TO authenticated USING (get_user_role() IN ('owner','manager'));

-- ============================================================
-- PRODUCTS — semua staff select/insert/update (perlu buat kasir
-- update stok saat transaksi), delete cuma owner/manager.
-- ============================================================
DROP POLICY IF EXISTS "products_select" ON public.products;
DROP POLICY IF EXISTS "products_insert" ON public.products;
DROP POLICY IF EXISTS "products_update" ON public.products;
DROP POLICY IF EXISTS "products_delete" ON public.products;
CREATE POLICY "products_select" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "products_insert" ON public.products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "products_update" ON public.products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "products_delete" ON public.products FOR DELETE TO authenticated USING (get_user_role() IN ('owner','manager'));

-- ============================================================
-- CASH_SESSIONS — kas harian per kasir. Kasir cuma boleh lihat/buka/
-- tutup sesi kasnya sendiri; owner/manager boleh lihat semua (laporan).
-- ============================================================
DROP POLICY IF EXISTS "cash_sessions_select_own"   ON public.cash_sessions;
DROP POLICY IF EXISTS "cash_sessions_select_admin" ON public.cash_sessions;
DROP POLICY IF EXISTS "cash_sessions_insert"        ON public.cash_sessions;
DROP POLICY IF EXISTS "cash_sessions_update"        ON public.cash_sessions;
CREATE POLICY "cash_sessions_select_own"   ON public.cash_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "cash_sessions_select_admin" ON public.cash_sessions FOR SELECT TO authenticated USING (get_user_role() IN ('owner','manager'));
CREATE POLICY "cash_sessions_insert"       ON public.cash_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cash_sessions_update"       ON public.cash_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TRANSACTIONS — sebelumnya cuma ada policy DELETE, jadi SELECT/
-- INSERT/UPDATE ikut terblokir. Tambah yang kurang saja.
-- ============================================================
DROP POLICY IF EXISTS "transactions_select" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert" ON public.transactions;
DROP POLICY IF EXISTS "transactions_update" ON public.transactions;
CREATE POLICY "transactions_select" ON public.transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "transactions_insert" ON public.transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "transactions_update" ON public.transactions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
-- (policy transactions_delete yang lama, khusus owner/manager, tetap dipakai — tidak disentuh)

-- ============================================================
-- TRANSACTION_ITEMS — sebelumnya cuma ada UPDATE & DELETE.
-- Tambah SELECT & INSERT yang kurang.
-- ============================================================
DROP POLICY IF EXISTS "transaction_items_select" ON public.transaction_items;
DROP POLICY IF EXISTS "transaction_items_insert" ON public.transaction_items;
CREATE POLICY "transaction_items_select" ON public.transaction_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "transaction_items_insert" ON public.transaction_items FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- STOCK_ADJUSTMENTS (stok opname) — semua staff select/insert,
-- approve/update & delete cuma owner/manager.
-- ============================================================
DROP POLICY IF EXISTS "stock_adjustments_select" ON public.stock_adjustments;
DROP POLICY IF EXISTS "stock_adjustments_insert" ON public.stock_adjustments;
DROP POLICY IF EXISTS "stock_adjustments_update" ON public.stock_adjustments;
DROP POLICY IF EXISTS "stock_adjustments_delete" ON public.stock_adjustments;
CREATE POLICY "stock_adjustments_select" ON public.stock_adjustments FOR SELECT TO authenticated USING (true);
CREATE POLICY "stock_adjustments_insert" ON public.stock_adjustments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "stock_adjustments_update" ON public.stock_adjustments FOR UPDATE TO authenticated USING (get_user_role() IN ('owner','manager')) WITH CHECK (get_user_role() IN ('owner','manager'));
CREATE POLICY "stock_adjustments_delete" ON public.stock_adjustments FOR DELETE TO authenticated USING (get_user_role() IN ('owner','manager'));

-- ============================================================
-- RETURNS (retur jual/beli) — sama pola dengan stock_adjustments.
-- ============================================================
DROP POLICY IF EXISTS "returns_select" ON public.returns;
DROP POLICY IF EXISTS "returns_insert" ON public.returns;
DROP POLICY IF EXISTS "returns_update" ON public.returns;
DROP POLICY IF EXISTS "returns_delete" ON public.returns;
CREATE POLICY "returns_select" ON public.returns FOR SELECT TO authenticated USING (true);
CREATE POLICY "returns_insert" ON public.returns FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "returns_update" ON public.returns FOR UPDATE TO authenticated USING (get_user_role() IN ('owner','manager')) WITH CHECK (get_user_role() IN ('owner','manager'));
CREATE POLICY "returns_delete" ON public.returns FOR DELETE TO authenticated USING (get_user_role() IN ('owner','manager'));

-- ============================================================
-- EXPENSES (pembayaran lainnya) — semua staff select/insert,
-- update/delete cuma owner/manager.
-- ============================================================
DROP POLICY IF EXISTS "expenses_select" ON public.expenses;
DROP POLICY IF EXISTS "expenses_insert" ON public.expenses;
DROP POLICY IF EXISTS "expenses_update" ON public.expenses;
DROP POLICY IF EXISTS "expenses_delete" ON public.expenses;
CREATE POLICY "expenses_select" ON public.expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "expenses_insert" ON public.expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "expenses_update" ON public.expenses FOR UPDATE TO authenticated USING (get_user_role() IN ('owner','manager')) WITH CHECK (get_user_role() IN ('owner','manager'));
CREATE POLICY "expenses_delete" ON public.expenses FOR DELETE TO authenticated USING (get_user_role() IN ('owner','manager'));

-- ============================================================
-- STORE_CONFIGS — pengaturan toko. Semua staff boleh lihat,
-- cuma owner yang boleh ubah.
-- ============================================================
DROP POLICY IF EXISTS "store_configs_select" ON public.store_configs;
DROP POLICY IF EXISTS "store_configs_write"  ON public.store_configs;
CREATE POLICY "store_configs_select" ON public.store_configs FOR SELECT TO authenticated USING (true);
CREATE POLICY "store_configs_write"  ON public.store_configs FOR ALL    TO authenticated
  USING (get_user_role() = 'owner') WITH CHECK (get_user_role() = 'owner');
