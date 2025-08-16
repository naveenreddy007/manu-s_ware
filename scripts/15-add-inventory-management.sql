-- Add inventory tracking columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_backorders BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sku CHARACTER VARYING(100) UNIQUE;

-- Create inventory_logs table for tracking stock changes
CREATE TABLE IF NOT EXISTS inventory_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK (change_type IN ('sale', 'restock', 'adjustment', 'return')),
  quantity_change INTEGER NOT NULL,
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  reason TEXT,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create low_stock_alerts table
CREATE TABLE IF NOT EXISTS low_stock_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  current_stock INTEGER NOT NULL,
  threshold INTEGER NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_id ON inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_at ON inventory_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_product_id ON low_stock_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_is_resolved ON low_stock_alerts(is_resolved);

-- Function to update inventory after order
CREATE OR REPLACE FUNCTION update_inventory_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update inventory for confirmed orders
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    -- Update stock for each order item
    UPDATE products 
    SET stock_quantity = stock_quantity - oi.quantity
    FROM order_items oi
    WHERE products.id = oi.product_id 
    AND oi.order_id = NEW.id
    AND products.track_inventory = true;
    
    -- Log inventory changes
    INSERT INTO inventory_logs (product_id, change_type, quantity_change, previous_quantity, new_quantity, order_id)
    SELECT 
      oi.product_id,
      'sale',
      -oi.quantity,
      p.stock_quantity + oi.quantity,
      p.stock_quantity,
      NEW.id
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = NEW.id AND p.track_inventory = true;
    
    -- Check for low stock and create alerts
    INSERT INTO low_stock_alerts (product_id, current_stock, threshold)
    SELECT 
      p.id,
      p.stock_quantity,
      p.low_stock_threshold
    FROM products p
    JOIN order_items oi ON oi.product_id = p.id
    WHERE oi.order_id = NEW.id
    AND p.track_inventory = true
    AND p.stock_quantity <= p.low_stock_threshold
    AND NOT EXISTS (
      SELECT 1 FROM low_stock_alerts lsa 
      WHERE lsa.product_id = p.id AND lsa.is_resolved = false
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory updates
DROP TRIGGER IF EXISTS trigger_update_inventory_on_order ON orders;
CREATE TRIGGER trigger_update_inventory_on_order
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_order();

-- Function to check stock availability
CREATE OR REPLACE FUNCTION check_stock_availability(product_uuid UUID, required_quantity INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  current_stock INTEGER;
  track_inv BOOLEAN;
  allow_back BOOLEAN;
BEGIN
  SELECT stock_quantity, track_inventory, allow_backorders
  INTO current_stock, track_inv, allow_back
  FROM products
  WHERE id = product_uuid;
  
  -- If inventory tracking is disabled, always allow
  IF NOT track_inv THEN
    RETURN true;
  END IF;
  
  -- If backorders are allowed, always allow
  IF allow_back THEN
    RETURN true;
  END IF;
  
  -- Check if we have enough stock
  RETURN current_stock >= required_quantity;
END;
$$ LANGUAGE plpgsql;

-- Update existing products with default inventory values
UPDATE products 
SET 
  stock_quantity = 50,
  low_stock_threshold = 5,
  track_inventory = true,
  allow_backorders = false,
  sku = 'MAN-' || SUBSTRING(id::text, 1, 8)
WHERE stock_quantity IS NULL;

-- Enable RLS
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE low_stock_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for inventory_logs (admin only)
CREATE POLICY "Admin can view all inventory logs" ON inventory_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can insert inventory logs" ON inventory_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- RLS policies for low_stock_alerts (admin only)
CREATE POLICY "Admin can view all low stock alerts" ON low_stock_alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can update low stock alerts" ON low_stock_alerts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );
