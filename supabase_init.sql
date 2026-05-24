-- ============================================================
-- TOKKU ERP & POS - Database Schema Initialization
-- Version: 2.1
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABEL: profiles (User management)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'kasir' CHECK (role IN ('owner', 'admin', 'kasir', 'stoker')),
  is_active BOOLEAN DEFAULT true,
  store_name TEXT DEFAULT 'Tokku Store',
  store_address TEXT,
  store_phone TEXT,
  store_logo TEXT,
  ecommerce_username TEXT, -- For digital store link
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL: store_configs (Advanced store settings)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.store_configs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  bank_accounts JSONB DEFAULT '[]', -- List of accounts for billing
  digital_store_active BOOLEAN DEFAULT true,
  ads_banners JSONB DEFAULT '[]', -- Promo banners
  receipt_footer TEXT DEFAULT 'Terima kasih telah berbelanja!',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL: branches (Sales Cabang)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  address TEXT,
  phone TEXT,
  pic_id UUID REFERENCES public.profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL: categories (3-level support)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.categories(id), -- Level support
  level INTEGER DEFAULT 1,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL: brands
-- ============================================================
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL: suppliers (Pemasok)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  npwp TEXT,
  address TEXT,
  phone TEXT,
  sales_name TEXT,
  sales_phone TEXT,
  payment_term_days INTEGER DEFAULT 0, -- TOP
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL: customers (Pelanggan)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  customer_type TEXT DEFAULT 'retail' CHECK (customer_type IN ('toko', 'perusahaan', 'retail')),
  payment_term_days INTEGER DEFAULT 0, -- Tempo pembayaran
  credit_limit DECIMAL(15,2) DEFAULT 0,
  deposit_balance DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL: products (SKU Master)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  parent_id UUID REFERENCES public.products(id), -- Induk vs Eceran
  sku TEXT UNIQUE,
  barcode TEXT,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id),
  brand_id UUID REFERENCES public.brands(id),
  unit TEXT DEFAULT 'pcs',
  cost_price DECIMAL(15,2) DEFAULT 0, -- Modal
  min_selling_price DECIMAL(15,2) DEFAULT 0, -- Jual Minimum
  standard_selling_price DECIMAL(15,2) DEFAULT 0, -- Jual Standard
  stock DECIMAL(15,2) DEFAULT 0,
  min_stock_alert DECIMAL(15,2) DEFAULT 0,
  image_url TEXT,
  location_sku TEXT, -- Gudang, Rak, dll
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL: cash_sessions (Kas Harian)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cash_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  opening_time TIMESTAMPTZ DEFAULT NOW(),
  closing_time TIMESTAMPTZ,
  opening_balance DECIMAL(15,2) DEFAULT 0,
  closing_balance_system DECIMAL(15,2) DEFAULT 0,
  closing_balance_actual DECIMAL(15,2) DEFAULT 0,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  notes TEXT
);

-- ============================================================
-- TABEL: transactions (POS & History)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  cash_session_id UUID REFERENCES public.cash_sessions(id),
  customer_id UUID REFERENCES public.customers(id),
  cashier_id UUID REFERENCES public.profiles(id),
  subtotal DECIMAL(15,2) DEFAULT 0,
  discount_total DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,
  paid_amount DECIMAL(15,2) DEFAULT 0,
  payment_method TEXT CHECK (payment_method IN ('tunai', 'transfer', 'giro', 'deposit')),
  payment_status TEXT CHECK (payment_status IN ('lunas', 'piutang', 'batal')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transaction_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  product_name TEXT,
  quantity DECIMAL(15,2),
  price_at_sale DECIMAL(15,2),
  discount_amount DECIMAL(15,2) DEFAULT 0,
  subtotal DECIMAL(15,2)
);

-- ============================================================
-- TABEL: stock_adjustments (Stok Opname)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.stock_adjustments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id),
  system_stock DECIMAL(15,2),
  actual_stock DECIMAL(15,2),
  difference DECIMAL(15,2),
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_by UUID REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL: returns (Retur Penjualan & Pembelian)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.returns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT CHECK (type IN ('sales', 'purchase')),
  reference_id UUID, -- transaction_id or purchase_order_id
  product_id UUID REFERENCES public.products(id),
  quantity DECIMAL(15,2),
  condition TEXT CHECK (condition IN ('baik', 'rusak')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL: debts_receivables (Utang & Piutang)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.debts_receivables (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT CHECK (type IN ('utang', 'piutang')),
  entity_id UUID, -- customer_id or supplier_id
  amount DECIMAL(15,2),
  remaining_balance DECIMAL(15,2),
  due_date DATE,
  reference_id UUID, -- transaction_id or other
  status TEXT DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABEL: expenses (Pembayaran Lainnya)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category TEXT CHECK (category IN ('gaji', 'delivery', 'operasional', 'aset', 'pajak', 'lainnya')),
  description TEXT,
  amount DECIMAL(15,2),
  proof_url TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_products_modtime BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_customers_modtime BEFORE UPDATE ON customers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to sync stock on transaction
CREATE OR REPLACE FUNCTION sync_stock_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.products 
    SET stock = stock - NEW.quantity
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_sync_stock AFTER INSERT ON transaction_items FOR EACH ROW EXECUTE PROCEDURE sync_stock_on_transaction();
