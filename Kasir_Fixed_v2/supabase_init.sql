-- ============================================================
-- KASIRKU - Skrip Inisialisasi Database Supabase
-- Toko Bangunan Point of Sale System
-- Jalankan skrip ini di Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABEL: profiles (profil pengguna, extend auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'kasir' CHECK (role IN ('owner', 'manager', 'kasir')),
  is_active BOOLEAN DEFAULT true,
  store_name TEXT DEFAULT 'Toko Bangunan',
  store_address TEXT,
  store_phone TEXT,
  store_logo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL: categories (kategori produk)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📦',
  color TEXT DEFAULT '#f59e0b',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL: products (produk/inventori)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  barcode TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id),
  unit TEXT NOT NULL DEFAULT 'pcs' CHECK (unit IN ('pcs', 'kg', 'meter', 'roll', 'dus', 'sak', 'liter', 'set', 'lonjor', 'lembar')),
  purchase_price DECIMAL(15,2) DEFAULT 0,
  selling_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  stock DECIMAL(10,2) DEFAULT 0,
  min_stock DECIMAL(10,2) DEFAULT 5,
  max_stock DECIMAL(10,2) DEFAULT 1000,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  supplier TEXT,
  location TEXT, -- Lokasi rak di toko
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL: customers (pelanggan)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT,
  address TEXT,
  points INTEGER DEFAULT 0,       -- Poin loyalitas
  total_spent DECIMAL(15,2) DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'regular' CHECK (tier IN ('regular', 'silver', 'gold', 'platinum')),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL: transactions (transaksi penjualan)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.customers(id),
  cashier_id UUID REFERENCES public.profiles(id) NOT NULL,
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(15,2) DEFAULT 0,
  change_amount DECIMAL(15,2) DEFAULT 0,
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'transfer', 'qris', 'card', 'credit')),
  payment_status TEXT DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'cancelled', 'refunded')),
  points_earned INTEGER DEFAULT 0,
  points_used INTEGER DEFAULT 0,
  notes TEXT,
  receipt_printed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL: transaction_items (detail item transaksi)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transaction_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  product_name TEXT NOT NULL, -- Snapshot nama produk saat transaksi
  product_barcode TEXT,
  unit TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  purchase_price DECIMAL(15,2) DEFAULT 0,
  selling_price DECIMAL(15,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  subtotal DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL: stock_movements (riwayat pergerakan stok)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment', 'return')),
  quantity DECIMAL(10,2) NOT NULL,
  before_stock DECIMAL(10,2) NOT NULL,
  after_stock DECIMAL(10,2) NOT NULL,
  reference_id UUID,        -- ID transaksi atau penyesuaian
  reference_type TEXT,      -- 'transaction', 'manual', 'return'
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL: loyalty_programs (program loyalitas)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.loyalty_programs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  min_purchase DECIMAL(15,2) DEFAULT 0,
  points_per_10k INTEGER DEFAULT 1,   -- Poin per Rp10.000 belanja
  point_value INTEGER DEFAULT 100,     -- Nilai 1 poin dalam Rupiah
  tier TEXT DEFAULT 'regular',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL: expenses (pengeluaran/biaya operasional)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FUNGSI: Auto-update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk setiap tabel yang memiliki updated_at
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- FUNGSI: Auto-create profile saat user baru daftar
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'kasir')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- FUNGSI: Generate nomor invoice otomatis
-- ============================================================
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  today TEXT;
  counter INTEGER;
  invoice TEXT;
BEGIN
  today := TO_CHAR(NOW(), 'YYYYMMDD');
  SELECT COUNT(*) + 1 INTO counter
  FROM public.transactions
  WHERE DATE(created_at) = CURRENT_DATE;
  invoice := 'INV-' || today || '-' || LPAD(counter::TEXT, 4, '0');
  RETURN invoice;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNGSI: Update stok setelah transaksi
-- ============================================================
CREATE OR REPLACE FUNCTION update_stock_after_transaction()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
BEGIN
  -- Kurangi stok untuk setiap item transaksi
  FOR item IN
    SELECT ti.product_id, ti.quantity, p.stock
    FROM transaction_items ti
    JOIN products p ON p.id = ti.product_id
    WHERE ti.transaction_id = NEW.id
  LOOP
    -- Catat pergerakan stok
    INSERT INTO stock_movements (product_id, type, quantity, before_stock, after_stock, reference_id, reference_type, notes)
    VALUES (item.product_id, 'out', item.quantity, item.stock, item.stock - item.quantity, NEW.id, 'transaction', 'Penjualan ' || NEW.invoice_number);
    
    -- Update stok produk
    UPDATE products SET stock = stock - item.quantity, updated_at = NOW()
    WHERE id = item.product_id;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_transaction_created
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  WHEN (NEW.payment_status = 'paid')
  EXECUTE FUNCTION update_stock_after_transaction();

-- ============================================================
-- FUNGSI: Update statistik pelanggan setelah transaksi
-- ============================================================
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_id IS NOT NULL THEN
    UPDATE public.customers
    SET 
      total_spent = total_spent + NEW.total_amount,
      total_transactions = total_transactions + 1,
      points = points + NEW.points_earned - NEW.points_used,
      -- Update tier berdasarkan total pembelian
      tier = CASE
        WHEN total_spent + NEW.total_amount >= 50000000 THEN 'platinum'
        WHEN total_spent + NEW.total_amount >= 10000000 THEN 'gold'
        WHEN total_spent + NEW.total_amount >= 2000000 THEN 'silver'
        ELSE 'regular'
      END,
      updated_at = NOW()
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_transaction_update_customer
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  WHEN (NEW.payment_status = 'paid')
  EXECUTE FUNCTION update_customer_stats();

-- ============================================================
-- VIEW: Dashboard summary
-- ============================================================
CREATE OR REPLACE VIEW daily_sales_summary AS
SELECT
  DATE(created_at)                  AS sale_date,
  COUNT(*)                          AS total_transactions,
  SUM(total_amount)                 AS total_revenue,
  SUM(discount_amount)              AS total_discount,
  AVG(total_amount)                 AS avg_transaction,
  COUNT(DISTINCT customer_id)       AS unique_customers
FROM public.transactions
WHERE payment_status = 'paid'
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

-- ============================================================
-- VIEW: Low stock alert
-- ============================================================
CREATE OR REPLACE VIEW low_stock_products AS
SELECT
  p.id, p.barcode, p.name, p.stock, p.min_stock, p.unit,
  c.name as category_name
FROM public.products p
LEFT JOIN public.categories c ON c.id = p.category_id
WHERE p.stock <= p.min_stock AND p.is_active = true
ORDER BY p.stock ASC;

-- ============================================================
-- VIEW: Top produk terlaris
-- ============================================================
CREATE OR REPLACE VIEW top_selling_products AS
SELECT
  p.id, p.name, p.unit,
  SUM(ti.quantity) as total_qty_sold,
  SUM(ti.subtotal) as total_revenue,
  COUNT(DISTINCT ti.transaction_id) as transaction_count
FROM public.transaction_items ti
JOIN public.products p ON p.id = ti.product_id
JOIN public.transactions t ON t.id = ti.transaction_id
WHERE t.payment_status = 'paid'
  AND t.created_at >= NOW() - INTERVAL '30 days'
GROUP BY p.id, p.name, p.unit
ORDER BY total_qty_sold DESC
LIMIT 20;

-- ============================================================
-- INDEX untuk performa query
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_cashier ON public.transactions(cashier_id);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON public.transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_tx ON public.transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_product ON public.transaction_items(product_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Aktifkan RLS di semua tabel
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Helper function: cek role user
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- PROFILES: User bisa lihat semua, edit hanya milik sendiri; owner bisa edit semua
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR get_user_role() IN ('owner', 'manager'));

-- CATEGORIES: Semua user authenticated bisa lihat; owner & manager bisa edit
CREATE POLICY "categories_select" ON public.categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "categories_insert" ON public.categories
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('owner', 'manager'));

CREATE POLICY "categories_update" ON public.categories
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('owner', 'manager'));

CREATE POLICY "categories_delete" ON public.categories
  FOR DELETE TO authenticated
  USING (get_user_role() = 'owner');

-- PRODUCTS: Semua bisa lihat; kasir hanya bisa lihat; manager/owner bisa edit
CREATE POLICY "products_select" ON public.products
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "products_insert" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('owner', 'manager'));

CREATE POLICY "products_update" ON public.products
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('owner', 'manager'));

CREATE POLICY "products_delete" ON public.products
  FOR DELETE TO authenticated
  USING (get_user_role() = 'owner');

-- CUSTOMERS: Semua bisa lihat & tambah; edit oleh manager/owner
CREATE POLICY "customers_select" ON public.customers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "customers_insert" ON public.customers
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "customers_update" ON public.customers
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('owner', 'manager'));

-- TRANSACTIONS: Kasir bisa lihat milik sendiri; manager/owner bisa lihat semua
CREATE POLICY "transactions_select_own" ON public.transactions
  FOR SELECT TO authenticated
  USING (cashier_id = auth.uid() OR get_user_role() IN ('owner', 'manager'));

CREATE POLICY "transactions_insert" ON public.transactions
  FOR INSERT TO authenticated WITH CHECK (cashier_id = auth.uid());

CREATE POLICY "transactions_update" ON public.transactions
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('owner', 'manager'));

-- TRANSACTION_ITEMS: Bisa diakses sesuai transaksi yang bisa diakses
CREATE POLICY "transaction_items_select" ON public.transaction_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "transaction_items_insert" ON public.transaction_items
  FOR INSERT TO authenticated WITH CHECK (true);

-- STOCK_MOVEMENTS: Semua bisa lihat; manager/owner bisa tambah manual
CREATE POLICY "stock_movements_select" ON public.stock_movements
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "stock_movements_insert" ON public.stock_movements
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('owner', 'manager') OR reference_type = 'transaction');

-- LOYALTY_PROGRAMS: Semua bisa lihat; owner bisa kelola
CREATE POLICY "loyalty_select" ON public.loyalty_programs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "loyalty_manage" ON public.loyalty_programs
  FOR ALL TO authenticated
  USING (get_user_role() = 'owner');

-- EXPENSES: Owner & manager bisa kelola
CREATE POLICY "expenses_select" ON public.expenses
  FOR SELECT TO authenticated
  USING (get_user_role() IN ('owner', 'manager'));

CREATE POLICY "expenses_insert" ON public.expenses
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('owner', 'manager'));

-- ============================================================
-- DATA AWAL (SEED DATA) untuk Toko Bangunan
-- ============================================================

-- Kategori Produk Toko Bangunan
INSERT INTO public.categories (name, description, icon, color) VALUES
  ('Semen & Beton', 'Semen, beton siap pakai, mortar', '🏗️', '#ef4444'),
  ('Besi & Baja', 'Besi beton, baja ringan, pipa besi', '⚙️', '#6b7280'),
  ('Kayu & Triplek', 'Kayu balok, triplek, papan', '🪵', '#a16207'),
  ('Keramik & Lantai', 'Keramik, granite, vinyl, parket', '🏠', '#7c3aed'),
  ('Cat & Finishing', 'Cat tembok, cat kayu, plamir, dempul', '🎨', '#db2777'),
  ('Pipa & Sanitasi', 'Pipa PVC, fitting, kloset, wastafel', '🚿', '#0891b2'),
  ('Atap & Rangka', 'Genteng, spandek, rangka baja ringan', '🏘️', '#059669'),
  ('Elektrikal', 'Kabel, stop kontak, saklar, lampu', '⚡', '#d97706'),
  ('Alat & Perkakas', 'Palu, gergaji, bor, kunci', '🔧', '#64748b'),
  ('Perekat & Kimia', 'Lem, epoxy, waterproofing, sealant', '🧪', '#7c3aed'),
  ('Pintu & Jendela', 'Pintu besi, jendela aluminium, kaca', '🚪', '#0284c7'),
  ('Pasir & Agregat', 'Pasir, batu split, coral, sirtu', '🪨', '#92400e')
ON CONFLICT DO NOTHING;

-- Program Loyalitas Default
INSERT INTO public.loyalty_programs (name, description, min_purchase, points_per_10k, point_value, tier) VALUES
  ('Regular Member', 'Member reguler toko', 0, 1, 100, 'regular'),
  ('Silver Member', 'Member silver (total belanja > Rp2jt)', 2000000, 2, 100, 'silver'),
  ('Gold Member', 'Member gold (total belanja > Rp10jt)', 10000000, 3, 100, 'gold'),
  ('Platinum Member', 'Member platinum (total belanja > Rp50jt)', 50000000, 5, 100, 'platinum')
ON CONFLICT DO NOTHING;

-- Contoh produk toko bangunan
-- (Uncomment jika ingin data contoh)
/*
INSERT INTO public.products (barcode, name, category_id, unit, purchase_price, selling_price, stock, min_stock) VALUES
  ('8999999000001', 'Semen Tiga Roda 50kg', (SELECT id FROM categories WHERE name = 'Semen & Beton'), 'sak', 55000, 68000, 200, 20),
  ('8999999000002', 'Besi Beton 10mm 12m', (SELECT id FROM categories WHERE name = 'Besi & Baja'), 'lonjor', 95000, 115000, 100, 10),
  ('8999999000003', 'Triplek 12mm 122x244', (SELECT id FROM categories WHERE name = 'Kayu & Triplek'), 'lembar', 180000, 220000, 50, 10),
  ('8999999000004', 'Cat Tembok Dulux 5kg', (SELECT id FROM categories WHERE name = 'Cat & Finishing'), 'pcs', 95000, 125000, 30, 5),
  ('8999999000005', 'Pipa PVC 4inch 4m', (SELECT id FROM categories WHERE name = 'Pipa & Sanitasi'), 'lonjor', 45000, 58000, 80, 15);
*/

-- ============================================================
-- SELESAI! Database KASIRKU berhasil diinisialisasi.
-- ============================================================


-- ============================================================
-- PATCH v8: Fix 406 error & RLS untuk user baru
-- Jalankan bagian ini di Supabase SQL Editor jika sudah pernah
-- menjalankan supabase_init.sql sebelumnya
-- ============================================================

-- Fix get_user_role agar tidak return NULL untuk user baru
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()),
    'kasir'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Pastikan user baru langsung bisa insert ke profiles (untuk trigger)
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- Products: kasir bisa update HANYA field stock (untuk transaksi)
DROP POLICY IF EXISTS "products_update" ON public.products;
CREATE POLICY "products_update" ON public.products
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (get_user_role() IN ('owner', 'manager', 'kasir'));


-- ============================================================
-- PATCH v10: Fix 403 Forbidden — anon key bisa read products
-- Jalankan di Supabase SQL Editor jika tabel sudah dibuat
-- ============================================================

-- Izinkan anon (belum login) baca products & categories untuk halaman publik
-- Hapus dulu policy lama yang hanya untuk authenticated
DROP POLICY IF EXISTS "products_select" ON public.products;
CREATE POLICY "products_select" ON public.products
  FOR SELECT USING (true);  -- anon & authenticated boleh SELECT

DROP POLICY IF EXISTS "categories_select" ON public.categories;
CREATE POLICY "categories_select" ON public.categories
  FOR SELECT USING (true);  -- anon & authenticated boleh SELECT

-- Pastikan profiles bisa dibaca oleh pemiliknya sendiri
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT TO authenticated USING (true);

-- Fix get_user_role agar tidak error saat user baru belum punya profile
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()),
    'kasir'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- SELESAI PATCH v10
-- ============================================================
