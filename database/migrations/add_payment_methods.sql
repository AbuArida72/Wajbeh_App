-- ============================================================
-- Migration: Add payment_methods table + possible_contents column
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Add possible_contents column to bags table
--    Stores an array of content keys (e.g. ["contentsBread", "contentsPastries"])
ALTER TABLE bags
  ADD COLUMN IF NOT EXISTS possible_contents JSONB DEFAULT '[]'::jsonb;

-- ============================================================
-- 2. Create payment_methods table (one card per user)
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_methods (
  id               UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID    REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  card_number_masked VARCHAR(25) NOT NULL,  -- e.g. "•••• •••• •••• 4242"
  cardholder_name  VARCHAR(255) NOT NULL,
  expiry_date      VARCHAR(5)   NOT NULL,   -- MM/YY
  cvv_masked       VARCHAR(5)   DEFAULT '•••',
  created_at       TIMESTAMPTZ  DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  DEFAULT NOW()
);

-- One card per user (unique constraint)
CREATE UNIQUE INDEX IF NOT EXISTS payment_methods_user_id_idx
  ON payment_methods (user_id);

-- ============================================================
-- 3. Row Level Security
-- ============================================================
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Users can only read their own payment method
CREATE POLICY "Users read own payment method"
  ON payment_methods FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own payment method
CREATE POLICY "Users insert own payment method"
  ON payment_methods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own payment method
CREATE POLICY "Users update own payment method"
  ON payment_methods FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own payment method
CREATE POLICY "Users delete own payment method"
  ON payment_methods FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 4. Auto-update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
