-- Comprehensive Affiliate Program Implementation

-- Affiliate interactions tracking table
CREATE TABLE IF NOT EXISTS affiliate_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL CHECK (action IN (
    'product_tagged', 'product_untagged', 'product_viewed', 
    'product_clicked', 'add_to_cart', 'purchase_initiated', 
    'purchase_completed', 'purchase_cancelled'
  )),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  inspiration_id UUID REFERENCES outfit_inspirations(id) ON DELETE CASCADE,
  commission_rate DECIMAL(5,4) DEFAULT 0.05, -- 5% default commission
  sale_amount DECIMAL(10,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Affiliate program settings table
CREATE TABLE IF NOT EXISTS affiliate_program_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  payment_method VARCHAR(100) DEFAULT 'bank_transfer',
  payment_details JSONB DEFAULT '{}',
  minimum_payout DECIMAL(10,2) DEFAULT 50.00,
  tax_information JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Affiliate payouts table
CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payment_method VARCHAR(100) NOT NULL,
  payment_reference VARCHAR(255),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Add affiliate commission to products table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'affiliate_commission') THEN
    ALTER TABLE products ADD COLUMN affiliate_commission DECIMAL(5,4) DEFAULT 0.05;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'affiliate_enabled') THEN
    ALTER TABLE products ADD COLUMN affiliate_enabled BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_affiliate_interactions_user_id ON affiliate_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_interactions_action ON affiliate_interactions(action);
CREATE INDEX IF NOT EXISTS idx_affiliate_interactions_product_id ON affiliate_interactions(product_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_interactions_created_at ON affiliate_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_user_id ON affiliate_payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_status ON affiliate_payouts(status);

-- RLS Policies
ALTER TABLE affiliate_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_program_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;

-- Users can manage their own affiliate data
DROP POLICY IF EXISTS "Users can manage their own affiliate interactions" ON affiliate_interactions;
CREATE POLICY "Users can manage their own affiliate interactions" ON affiliate_interactions
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own affiliate settings" ON affiliate_program_settings;
CREATE POLICY "Users can manage their own affiliate settings" ON affiliate_program_settings
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own affiliate payouts" ON affiliate_payouts;
CREATE POLICY "Users can view their own affiliate payouts" ON affiliate_payouts
  FOR SELECT USING (auth.uid() = user_id);

-- Function to calculate affiliate earnings
CREATE OR REPLACE FUNCTION calculate_affiliate_earnings(
  user_uuid UUID,
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_earnings DECIMAL(10,2),
  total_sales INTEGER,
  average_commission DECIMAL(5,4)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(ai.sale_amount * ai.commission_rate), 0) as total_earnings,
    COUNT(*)::INTEGER as total_sales,
    COALESCE(AVG(ai.commission_rate), 0) as average_commission
  FROM affiliate_interactions ai
  WHERE ai.user_id = user_uuid
    AND ai.action = 'purchase_completed'
    AND ai.created_at::DATE BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process affiliate payouts
CREATE OR REPLACE FUNCTION process_affiliate_payout(
  user_uuid UUID,
  payout_amount DECIMAL(10,2),
  payment_method_param VARCHAR(100)
)
RETURNS UUID AS $$
DECLARE
  payout_id UUID;
  current_earnings DECIMAL(10,2);
BEGIN
  -- Check current earnings
  SELECT total_earnings INTO current_earnings
  FROM calculate_affiliate_earnings(user_uuid);
  
  -- Verify sufficient earnings
  IF current_earnings < payout_amount THEN
    RAISE EXCEPTION 'Insufficient earnings for payout';
  END IF;
  
  -- Create payout record
  INSERT INTO affiliate_payouts (
    user_id,
    amount,
    payment_method,
    period_start,
    period_end
  ) VALUES (
    user_uuid,
    payout_amount,
    payment_method_param,
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE
  ) RETURNING id INTO payout_id;
  
  RETURN payout_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update products with default affiliate settings
UPDATE products 
SET 
  affiliate_commission = 0.05,
  affiliate_enabled = true
WHERE affiliate_commission IS NULL;

-- Create default affiliate program settings for existing users
INSERT INTO affiliate_program_settings (user_id, is_active, minimum_payout)
SELECT 
  id,
  true,
  50.00
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM affiliate_program_settings)
ON CONFLICT (user_id) DO NOTHING;

-- Wrapped RAISE statement in DO block to fix PostgreSQL syntax error
DO $$
BEGIN
  RAISE NOTICE 'Affiliate program implementation completed successfully!';
END $$;
