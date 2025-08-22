-- Add creator_id column to cart_items table for affiliate tracking
-- This allows tracking which creator referred a product that was added to cart

-- Add the creator_id column
ALTER TABLE cart_items 
ADD COLUMN creator_id UUID;

-- Add foreign key constraint to reference auth.users
ALTER TABLE cart_items 
ADD CONSTRAINT cart_items_creator_id_fkey 
FOREIGN KEY (creator_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for better query performance on creator_id
CREATE INDEX idx_cart_items_creator_id ON cart_items(creator_id);

-- Add comment to document the column purpose
COMMENT ON COLUMN cart_items.creator_id IS 'UUID of the creator who referred this product for affiliate tracking';
