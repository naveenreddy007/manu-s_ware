-- Add price column to cart_items table
-- This stores the price at the time the item was added to cart for order history consistency

-- Add the price column
ALTER TABLE cart_items 
ADD COLUMN price NUMERIC NOT NULL DEFAULT 0;

-- Add comment to document the column purpose
COMMENT ON COLUMN cart_items.price IS 'Price of the product at the time it was added to cart for order consistency';

-- Update existing cart items with current product prices
UPDATE cart_items 
SET price = products.price 
FROM products 
WHERE cart_items.product_id = products.id;
