-- Phase 2: Shopping Integration and Cart Functionality
-- Add shopping tracking and cart integration for inspiration posts

-- Removed storage bucket creation that was causing errors
-- Fixed column references to match existing database schema
-- Update existing inspiration_purchases table to match our needs
ALTER TABLE inspiration_purchases 
ADD COLUMN IF NOT EXISTS purchase_type TEXT CHECK (purchase_type IN ('complete_look', 'individual_item')),
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 5.00,
ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10,2);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_inspiration_purchases_inspiration_id ON inspiration_purchases(inspiration_id);
CREATE INDEX IF NOT EXISTS idx_inspiration_purchases_creator_user_id ON inspiration_purchases(creator_user_id);
CREATE INDEX IF NOT EXISTS idx_inspiration_purchases_buyer_user_id ON inspiration_purchases(buyer_user_id);

-- Enable RLS if not already enabled
ALTER TABLE inspiration_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inspiration_purchases
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'inspiration_purchases' 
    AND policyname = 'Users can view their own purchases'
  ) THEN
    CREATE POLICY "Users can view their own purchases" ON inspiration_purchases
      FOR SELECT USING (buyer_user_id = auth.uid() OR creator_user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'inspiration_purchases' 
    AND policyname = 'System can insert purchase records'
  ) THEN
    CREATE POLICY "System can insert purchase records" ON inspiration_purchases
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Add shopping stats to inspiration posts (denormalized for performance)
ALTER TABLE outfit_inspiration_posts 
ADD COLUMN IF NOT EXISTS total_purchases INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_commission DECIMAL(10,2) DEFAULT 0.00;

-- Function to update shopping stats
CREATE OR REPLACE FUNCTION update_inspiration_shopping_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE outfit_inspiration_posts 
    SET 
      total_purchases = total_purchases + 1,
      total_revenue = total_revenue + COALESCE(NEW.price, 0),
      total_commission = total_commission + COALESCE(NEW.commission_amount, 0)
    WHERE id = NEW.inspiration_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for shopping stats
DROP TRIGGER IF EXISTS trigger_update_inspiration_shopping_stats ON inspiration_purchases;
CREATE TRIGGER trigger_update_inspiration_shopping_stats
  AFTER INSERT ON inspiration_purchases
  FOR EACH ROW EXECUTE FUNCTION update_inspiration_shopping_stats();
