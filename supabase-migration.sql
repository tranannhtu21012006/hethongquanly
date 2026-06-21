-- ==========================================
-- SQL Migration: Clothes Shop Admin Database
-- Paste toàn bộ nội dung này vào Supabase SQL Editor rồi bấm RUN
-- ==========================================

-- 1. Bảng Danh mục
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Bảng Sản phẩm
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  image_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Bảng Biến thể sản phẩm (Size / Màu)
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  price BIGINT NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Bảng Giao dịch (Nhập/Xuất kho)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('IN', 'OUT')),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity INT NOT NULL,
  price BIGINT NOT NULL DEFAULT 0,
  discount BIGINT NOT NULL DEFAULT 0,
  total BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Bảng Cấu hình Shop (chỉ có 1 dòng duy nhất)
CREATE TABLE IF NOT EXISTS shop_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_name TEXT DEFAULT 'My Fashion Shop',
  owner_name TEXT DEFAULT 'Admin',
  nickname TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  address TEXT DEFAULT '',
  description TEXT DEFAULT '',
  contact TEXT DEFAULT '',
  exchange_rate NUMERIC DEFAULT 165,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tạo 1 dòng cấu hình mặc định
INSERT INTO shop_config (shop_name, owner_name, exchange_rate)
VALUES ('My Fashion Shop', 'Admin', 165)
ON CONFLICT DO NOTHING;

-- Thêm các danh mục mặc định
INSERT INTO categories (name) VALUES ('Áo'), ('Quần'), ('Váy'), ('Phụ kiện')
ON CONFLICT DO NOTHING;

-- ==========================================
-- Row Level Security (RLS) - Cho phép đọc/ghi công khai
-- (Vì đây là app quản lý nội bộ, chỉ người có link mới truy cập)
-- ==========================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_config ENABLE ROW LEVEL SECURITY;

-- Cho phép tất cả thao tác với anon key
CREATE POLICY "Allow all on categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on product_variants" ON product_variants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on shop_config" ON shop_config FOR ALL USING (true) WITH CHECK (true);
