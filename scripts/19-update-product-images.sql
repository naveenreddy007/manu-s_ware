-- Simple script to update existing product images with real URLs
-- This avoids all the complex insertion errors

UPDATE products SET images = '{"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400"}' WHERE name ILIKE '%shirt%' AND images IS NOT NULL;
UPDATE products SET images = '{"https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400"}' WHERE name ILIKE '%pant%' AND images IS NOT NULL;
UPDATE products SET images = '{"https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400"}' WHERE name ILIKE '%jacket%' AND images IS NOT NULL;
UPDATE products SET images = '{"https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400"}' WHERE name ILIKE '%shoe%' AND images IS NOT NULL;
UPDATE products SET images = '{"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400"}' WHERE name ILIKE '%watch%' AND images IS NOT NULL;

-- Add some basic demo products if none exist
INSERT INTO products (name, description, price, category, brand, color, sizes, images, tags, sku, stock_quantity, low_stock_threshold)
SELECT 'Classic White Shirt', 'Premium cotton dress shirt', 89.99, 'Shirts', 'MANUS', 'White', '{"S","M","L","XL"}', '{"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400"}', '{"formal","cotton","classic"}', 'MAN-001', 50, 10
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);

INSERT INTO products (name, description, price, category, brand, color, sizes, images, tags, sku, stock_quantity, low_stock_threshold)
SELECT 'Navy Chino Pants', 'Comfortable chino trousers', 79.99, 'Pants', 'MANUS', 'Navy', '{"30","32","34","36"}', '{"https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400"}', '{"casual","chino","navy"}', 'MAN-002', 40, 8
WHERE (SELECT COUNT(*) FROM products) < 2;

INSERT INTO products (name, description, price, category, brand, color, sizes, images, tags, sku, stock_quantity, low_stock_threshold)
SELECT 'Leather Dress Shoes', 'Handcrafted leather oxfords', 199.99, 'Shoes', 'MANUS', 'Brown', '{"8","9","10","11","12"}', '{"https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400"}', '{"formal","leather","oxford"}', 'MAN-003', 25, 5
WHERE (SELECT COUNT(*) FROM products) < 3;
