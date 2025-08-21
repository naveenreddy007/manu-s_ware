-- Add source column to track how items were added
ALTER TABLE wardrobe_items 
ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'manual';

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_source ON wardrobe_items(source);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_user_category ON wardrobe_items(user_id, category);

-- Create function to automatically add delivered items to wardrobe
CREATE OR REPLACE FUNCTION add_delivered_item_to_wardrobe()
RETURNS TRIGGER AS $$
BEGIN
  -- Only add to wardrobe when order status changes to 'delivered'
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    -- Get order items and add them to wardrobe
    INSERT INTO wardrobe_items (
      user_id,
      name,
      category,
      brand,
      color,
      size,
      image_url,
      source,
      purchase_date,
      created_at,
      updated_at
    )
    SELECT 
      o.user_id,
      p.name,
      p.category,
      p.brand,
      p.color,
      oi.size,
      p.image_url,
      'order' as source,
      NOW() as purchase_date,
      NOW() as created_at,
      NOW() as updated_at
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    WHERE o.id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic wardrobe addition
DROP TRIGGER IF EXISTS trigger_add_delivered_to_wardrobe ON orders;
CREATE TRIGGER trigger_add_delivered_to_wardrobe
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION add_delivered_item_to_wardrobe();

-- Update RLS policies for wardrobe_items
DROP POLICY IF EXISTS "Users can manage their own wardrobe items" ON wardrobe_items;
CREATE POLICY "Users can manage their own wardrobe items" ON wardrobe_items
  FOR ALL USING (auth.uid() = user_id);

-- Fixed RAISE NOTICE syntax by wrapping in DO block
DO $$
BEGIN
  RAISE NOTICE 'Enhanced wardrobe management system created successfully';
END $$;
