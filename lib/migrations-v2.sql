-- Migrations V2: Vault Goals and Custom Price Alerts for Precious Metals Pro

-- 1. Vault Goals Table
CREATE TABLE IF NOT EXISTS public.vault_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES neon_auth.user(id) ON DELETE CASCADE,
  metal TEXT NOT NULL,
  target_weight NUMERIC NOT NULL,
  weight_unit TEXT NOT NULL DEFAULT 'oz',
  target_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Custom Price Alerts Table
CREATE TABLE IF NOT EXISTS public.custom_price_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES neon_auth.user(id) ON DELETE CASCADE,
  metal TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('above', 'below')),
  target_price NUMERIC NOT NULL,
  is_triggered BOOLEAN DEFAULT FALSE,
  triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
