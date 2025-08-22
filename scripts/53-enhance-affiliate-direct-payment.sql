-- Updated script to work with existing affiliate tables instead of non-existent ones
-- Enhance existing affiliate system with direct payment support
DO $$
BEGIN
  -- Add direct payment support to affiliate_program_settings
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'affiliate_program_settings' AND column_name = 'direct_payment_enabled'
  ) THEN
    ALTER TABLE affiliate_program_settings ADD COLUMN direct_payment_enabled BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add commission split percentage for direct payments
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'affiliate_program_settings' AND column_name = 'commission_split_percentage'
  ) THEN
    ALTER TABLE affiliate_program_settings ADD COLUMN commission_split_percentage NUMERIC DEFAULT 0.95; -- 95% to affiliate, 5% to platform
  END IF;

  -- Add payment reference to affiliate_interactions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'affiliate_interactions' AND column_name = 'payment_reference'
  ) THEN
    ALTER TABLE affiliate_interactions ADD COLUMN payment_reference TEXT;
  END IF;

  -- Add direct payment flag to affiliate_interactions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'affiliate_interactions' AND column_name = 'is_direct_payment'
  ) THEN
    ALTER TABLE affiliate_interactions ADD COLUMN is_direct_payment BOOLEAN DEFAULT FALSE;
  END IF;

END $$;

-- Create affiliate direct payments tracking table
CREATE TABLE IF NOT EXISTS affiliate_direct_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  inspiration_id UUID REFERENCES outfit_inspiration_posts(id) ON DELETE SET NULL,
  payment_amount NUMERIC NOT NULL,
  affiliate_commission NUMERIC NOT NULL,
  platform_fee NUMERIC NOT NULL,
  payment_method TEXT DEFAULT 'direct',
  payment_reference TEXT,
  payment_status TEXT DEFAULT 'pending',
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS on affiliate direct payments
ALTER TABLE affiliate_direct_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for affiliate direct payments
DROP POLICY IF EXISTS "Users can view their affiliate payments" ON affiliate_direct_payments;
CREATE POLICY "Users can view their affiliate payments" ON affiliate_direct_payments
  FOR SELECT USING (auth.uid() = affiliate_user_id OR auth.uid() = customer_user_id);

DROP POLICY IF EXISTS "Affiliates can insert payment records" ON affiliate_direct_payments;
CREATE POLICY "Affiliates can insert payment records" ON affiliate_direct_payments
  FOR INSERT WITH CHECK (auth.uid() = affiliate_user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_affiliate_direct_payments_affiliate ON affiliate_direct_payments(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_direct_payments_customer ON affiliate_direct_payments(customer_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_direct_payments_product ON affiliate_direct_payments(product_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_direct_payments_status ON affiliate_direct_payments(payment_status);

DO $$
BEGIN
  RAISE NOTICE 'Enhanced affiliate system with direct payment support using existing schema';
END $$;
