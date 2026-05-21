-- Migrations schema setup for Precious Metals Pro PWA

-- 1. Helper Credentials table
CREATE TABLE IF NOT EXISTS public.user_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES neon_auth.user(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Extended User Profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES neon_auth.user(id) ON DELETE CASCADE,
  phone TEXT,
  shipping_address TEXT,
  billing_address TEXT,
  subscription_tier TEXT DEFAULT 'free',
  alert_price BOOLEAN DEFAULT TRUE,
  alert_drops BOOLEAN DEFAULT TRUE,
  alert_escrow BOOLEAN DEFAULT TRUE,
  alert_chat BOOLEAN DEFAULT TRUE
);

-- 3. Catalog Items
CREATE TABLE IF NOT EXISTS public.catalog_items (
  id VARCHAR(50) PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  weight NUMERIC NOT NULL,
  purity TEXT NOT NULL,
  metal TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC,
  premium NUMERIC NOT NULL,
  image_url TEXT,
  is_reserved BOOLEAN DEFAULT FALSE,
  reserved_by UUID REFERENCES neon_auth.user(id) ON DELETE SET NULL,
  reserved_at TIMESTAMP WITH TIME ZONE,
  expired_at TIMESTAMP WITH TIME ZONE
);

-- 4. Escrow Chat Messages
CREATE TABLE IF NOT EXISTS public.escrow_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id VARCHAR(50) NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES neon_auth.user(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('system', 'admin', 'user')),
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Vault Portfolio Items
CREATE TABLE IF NOT EXISTS public.vault_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES neon_auth.user(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  metal TEXT NOT NULL,
  category TEXT NOT NULL,
  weight NUMERIC NOT NULL,
  weight_unit TEXT NOT NULL,
  purity TEXT NOT NULL,
  purchase_price NUMERIC NOT NULL,
  purchase_spot_price NUMERIC NOT NULL,
  purchase_date DATE NOT NULL,
  target_growth NUMERIC,
  target_growth_type TEXT CHECK (target_growth_type IN ('percent', 'currency')),
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
