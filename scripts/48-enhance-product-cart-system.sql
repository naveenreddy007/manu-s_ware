-- Add proper column existence checks for all operations
-- Add multiple images support to products table (already exists, skip)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'images'
  ) THEN
    ALTER TABLE products ADD COLUMN images TEXT[] DEFAULT '{}';
  ELSE
    RAISE NOTICE 'Column images already exists in products table';
  END IF;
END $$;

-- Add stock quantity tracking (already exists, skip)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'stock_quantity'
  ) THEN
    ALTER TABLE products ADD COLUMN stock_quantity INTEGER DEFAULT 0;
  ELSE
    RAISE NOTICE 'Column stock_quantity already exists in products table';
  END IF;
END $$;

-- Remove the problematic UPDATE statement that references non-existent image_url column
-- The products table already has images array, no migration needed

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_active ON products(category, is_active);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_quantity) WHERE stock_quantity > 0;
CREATE INDEX IF NOT EXISTS idx_cart_items_user_product ON cart_items(user_id, product_id);

-- Add function to update stock when orders are placed
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrease stock when order status changes to 'confirmed'
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    UPDATE products 
    SET stock_quantity = stock_quantity - oi.quantity
    FROM order_items oi
    WHERE products.id = oi.product_id 
    AND oi.order_id = NEW.id;
  END IF;
  
  -- Restore stock when order is cancelled
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE products 
    SET stock_quantity = stock_quantity + oi.quantity
    FROM order_items oi
    WHERE products.id = oi.product_id 
    AND oi.order_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stock management
DROP TRIGGER IF EXISTS trigger_update_product_stock ON orders;
CREATE TRIGGER trigger_update_product_stock
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock();

-- Keep the properly wrapped RAISE NOTICE statement
DO $$ 
BEGIN
  RAISE NOTICE 'Enhanced product and cart system created successfully';
END $$;
