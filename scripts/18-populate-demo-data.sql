-- Updated to use proper UUIDs and reduced to 24 products for testing
-- Populate demo data for testing recommendation engine
-- 24 diverse products across categories with realistic data

-- Insert 24 diverse products with proper UUIDs
INSERT INTO products (id, name, description, price, category, subcategory, color, brand, sizes, images, tags, is_active, stock_quantity, low_stock_threshold, track_inventory, allow_backorders, sku) VALUES
-- Shirts (8 items)
-- Fixed duplicate SKU values by ensuring each product has a unique SKU
(gen_random_uuid(), 'Classic White Oxford Shirt', 'Premium cotton oxford shirt with button-down collar', 89.99, 'Shirts', 'Dress Shirts', 'White', 'MANUS', '{"S", "M", "L", "XL"}', '{"https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop"}', '{"cotton", "formal", "classic"}', true, 25, 5, true, false, 'MAN-SHT-WOX-001'),
(gen_random_uuid(), 'Navy Blue Polo Shirt', 'Luxury pique cotton polo with embroidered logo', 75.00, 'Shirts', 'Polo Shirts', 'Navy', 'MANUS', '{"S", "M", "L", "XL"}', '{"https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&h=400&fit=crop"}', '{"cotton", "casual", "polo"}', true, 30, 5, true, false, 'MAN-SHT-NBP-002'),
(gen_random_uuid(), 'Charcoal Henley Shirt', 'Soft cotton henley with three-button placket', 65.00, 'Shirts', 'Casual Shirts', 'Charcoal', 'MANUS', '{"S", "M", "L", "XL"}', '{"https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=400&fit=crop"}', '{"cotton", "casual", "henley"}', true, 20, 5, true, false, 'MAN-SHT-CHE-003'),
(gen_random_uuid(), 'Light Blue Chambray Shirt', 'Lightweight chambray shirt perfect for layering', 79.99, 'Shirts', 'Casual Shirts', 'Light Blue', 'MANUS', '{"S", "M", "L", "XL"}', '{"https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&h=400&fit=crop"}', '{"chambray", "casual", "layering"}', true, 18, 5, true, false, 'MAN-SHT-LBC-004'),
(gen_random_uuid(), 'Black Dress Shirt', 'Formal black dress shirt with French cuffs', 95.00, 'Shirts', 'Dress Shirts', 'Black', 'MANUS', '{"S", "M", "L", "XL"}', '{"https://images.unsplash.com/photo-1594938290083-2f9ceadc732d?w=400&h=400&fit=crop"}', '{"cotton", "formal", "dress"}', true, 15, 5, true, false, 'MAN-SHT-BDS-005'),
(gen_random_uuid(), 'Forest Green T-Shirt', 'Premium organic cotton t-shirt', 45.00, 'Shirts', 'T-Shirts', 'Forest Green', 'MANUS', '{"S", "M", "L", "XL"}', '{"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop"}', '{"organic", "cotton", "casual"}', true, 35, 10, true, false, 'MAN-SHT-FGT-006'),
(gen_random_uuid(), 'Striped Long Sleeve Tee', 'Classic navy and white striped long sleeve', 55.00, 'Shirts', 'T-Shirts', 'Navy/White', 'MANUS', '{"S", "M", "L", "XL"}', '{"https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=400&h=400&fit=crop"}', '{"cotton", "striped", "casual"}', true, 28, 8, true, false, 'MAN-SHT-SLS-007'),
(gen_random_uuid(), 'Pink Oxford Shirt', 'Light pink oxford shirt for spring styling', 89.99, 'Shirts', 'Dress Shirts', 'Pink', 'MANUS', '{"S", "M", "L", "XL"}', '{"https://images.unsplash.com/photo-1603252109303-2751441dd157?w=400&h=400&fit=crop"}', '{"cotton", "oxford", "spring"}', true, 21, 5, true, false, 'MAN-SHT-POX-008'),

-- Pants (6 items)
(gen_random_uuid(), 'Navy Chino Pants', 'Classic navy chino pants with tapered fit', 95.00, 'Pants', 'Chinos', 'Navy', 'MANUS', '{"30", "32", "34", "36", "38"}', '{"https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=400&fit=crop"}', '{"cotton", "chino", "tapered"}', true, 25, 5, true, false, 'MAN-PNT-NCH-001'),
(gen_random_uuid(), 'Charcoal Dress Pants', 'Formal charcoal wool dress pants', 145.00, 'Pants', 'Dress Pants', 'Charcoal', 'MANUS', '{"30", "32", "34", "36", "38"}', '{"https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop"}', '{"wool", "formal", "dress"}', true, 18, 4, true, false, 'MAN-PNT-CDP-002'),
(gen_random_uuid(), 'Dark Wash Jeans', 'Premium dark wash slim fit jeans', 125.00, 'Pants', 'Jeans', 'Dark Blue', 'MANUS', '{"30", "32", "34", "36", "38"}', '{"https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop"}', '{"denim", "slim", "dark"}', true, 30, 8, true, false, 'MAN-PNT-DWJ-003'),
(gen_random_uuid(), 'Khaki Cargo Pants', 'Utility cargo pants with multiple pockets', 89.00, 'Pants', 'Casual Pants', 'Khaki', 'MANUS', '{"30", "32", "34", "36", "38"}', '{"https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=400&fit=crop"}', '{"cargo", "utility", "pockets"}', true, 22, 5, true, false, 'MAN-PNT-KCP-004'),
(gen_random_uuid(), 'Light Gray Chinos', 'Light gray chino pants for summer', 95.00, 'Pants', 'Chinos', 'Light Gray', 'MANUS', '{"30", "32", "34", "36", "38"}', '{"https://images.unsplash.com/photo-1506629905607-d405d7d3b0d2?w=400&h=400&fit=crop"}', '{"cotton", "chino", "summer"}', true, 20, 5, true, false, 'MAN-PNT-LGC-005'),
(gen_random_uuid(), 'Black Joggers', 'Comfortable black joggers with elastic waist', 75.00, 'Pants', 'Casual Pants', 'Black', 'MANUS', '{"S", "M", "L", "XL"}', '{"https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop"}', '{"joggers", "comfortable", "elastic"}', true, 35, 10, true, false, 'MAN-PNT-BJG-006'),

-- Jackets & Outerwear (5 items)
(gen_random_uuid(), 'Navy Blazer', 'Classic navy wool blazer with notch lapels', 295.00, 'Jackets', 'Blazers', 'Navy', 'MANUS', '{"38", "40", "42", "44", "46"}', '{"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop"}', '{"wool", "blazer", "formal"}', true, 12, 3, true, false, 'MAN-JKT-NBL-001'),
(gen_random_uuid(), 'Black Leather Jacket', 'Premium black leather moto jacket', 395.00, 'Jackets', 'Leather Jackets', 'Black', 'MANUS', '{"S", "M", "L", "XL"}', '{"https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop"}', '{"leather", "moto", "premium"}', true, 8, 2, true, false, 'MAN-JKT-BLJ-002'),
(gen_random_uuid(), 'Gray Wool Coat', 'Long gray wool overcoat for winter', 345.00, 'Jackets', 'Coats', 'Gray', 'MANUS', '{"S", "M", "L", "XL"}', '{"https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400&h=400&fit=crop"}', '{"wool", "overcoat", "winter"}', true, 10, 2, true, false, 'MAN-JKT-GWC-003'),
(gen_random_uuid(), 'Olive Bomber Jacket', 'Olive green bomber jacket with ribbed cuffs', 185.00, 'Jackets', 'Casual Jackets', 'Olive', 'MANUS', '{"S", "M", "L", "XL"}', '{"https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=400&fit=crop"}', '{"bomber", "casual", "ribbed"}', true, 15, 3, true, false, 'MAN-JKT-OBJ-004'),
(gen_random_uuid(), 'Charcoal Cardigan', 'Soft charcoal wool cardigan sweater', 155.00, 'Jackets', 'Cardigans', 'Charcoal', 'MANUS', '{"S", "M", "L", "XL"}', '{"https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=400&h=400&fit=crop"}', '{"wool", "cardigan", "soft"}', true, 14, 3, true, false, 'MAN-JKT-CCG-005'),

-- Shoes (3 items)
(gen_random_uuid(), 'Black Oxford Shoes', 'Classic black leather oxford dress shoes', 195.00, 'Shoes', 'Dress Shoes', 'Black', 'MANUS', '{"8", "9", "10", "11", "12"}', '{"https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop"}', '{"leather", "oxford", "formal"}', true, 20, 4, true, false, 'MAN-SHO-BOX-001'),
(gen_random_uuid(), 'White Sneakers', 'Clean white leather sneakers with minimal design', 145.00, 'Shoes', 'Sneakers', 'White', 'MANUS', '{"8", "9", "10", "11", "12"}', '{"https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400&h=400&fit=crop"}', '{"leather", "sneakers", "minimal"}', true, 30, 8, true, false, 'MAN-SHO-WSN-002'),
(gen_random_uuid(), 'Brown Chelsea Boots', 'Brown leather Chelsea boots with elastic sides', 225.00, 'Shoes', 'Boots', 'Brown', 'MANUS', '{"8", "9", "10", "11", "12"}', '{"https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400&h=400&fit=crop"}', '{"leather", "chelsea", "boots"}', true, 15, 3, true, false, 'MAN-SHO-BCB-003'),

-- Accessories (2 items)
(gen_random_uuid(), 'Black Leather Belt', 'Classic black leather dress belt with silver buckle', 65.00, 'Accessories', 'Belts', 'Black', 'MANUS', '{"32", "34", "36", "38", "40"}', '{"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop"}', '{"leather", "belt", "formal"}', true, 35, 8, true, false, 'MAN-ACC-BLB-001'),
(gen_random_uuid(), 'Silver Watch', 'Minimalist silver watch with leather strap', 195.00, 'Accessories', 'Watches', 'Silver', 'MANUS', '{"One Size"}', '{"https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=400&fit=crop"}', '{"watch", "silver", "minimalist"}', true, 15, 3, true, false, 'MAN-ACC-SLW-002');

-- Add wardrobe items for test user using proper user lookup
-- Add wardrobe items for test user uscl.bilvalabs@gmail.com
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Get the user ID for uscl.bilvalabs@gmail.com
    SELECT id INTO test_user_id FROM auth.users WHERE email = 'uscl.bilvalabs@gmail.com';
    
    IF test_user_id IS NOT NULL THEN
        -- Insert diverse wardrobe items to test recommendation engine
        -- Updated wardrobe item images with real online fashion images
        INSERT INTO wardrobe_items (user_id, name, category, subcategory, color, brand, size, image_url, tags, notes) VALUES
        (test_user_id, 'Navy Suit Jacket', 'Jackets', 'Blazers', 'Navy', 'Hugo Boss', 'M', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', '{"formal", "business", "classic"}', 'My go-to business jacket'),
        (test_user_id, 'White Dress Shirt', 'Shirts', 'Dress Shirts', 'White', 'Brooks Brothers', 'M', 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop', '{"formal", "business", "classic"}', 'Perfect for meetings'),
        (test_user_id, 'Dark Jeans', 'Pants', 'Jeans', 'Dark Blue', 'Levis', '32', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop', '{"casual", "weekend", "versatile"}', 'Favorite weekend jeans'),
        (test_user_id, 'Gray Sweater', 'Jackets', 'Sweaters', 'Gray', 'Uniqlo', 'M', 'https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=400&h=400&fit=crop', '{"casual", "layering", "comfortable"}', 'Great for layering'),
        (test_user_id, 'Black Dress Shoes', 'Shoes', 'Dress Shoes', 'Black', 'Cole Haan', '10', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop', '{"formal", "business", "classic"}', 'Professional meetings'),
        (test_user_id, 'White Sneakers', 'Shoes', 'Sneakers', 'White', 'Adidas', '10', 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400&h=400&fit=crop', '{"casual", "sporty", "versatile"}', 'Daily wear sneakers'),
        (test_user_id, 'Brown Leather Belt', 'Accessories', 'Belts', 'Brown', 'Coach', '34', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop', '{"formal", "business", "classic"}', 'Matches brown shoes'),
        (test_user_id, 'Blue Polo Shirt', 'Shirts', 'Polo Shirts', 'Blue', 'Ralph Lauren', 'M', 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&h=400&fit=crop', '{"casual", "smart-casual", "versatile"}', 'Weekend favorite'),
        (test_user_id, 'Khaki Chinos', 'Pants', 'Chinos', 'Khaki', 'J.Crew', '32', 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=400&fit=crop', '{"casual", "smart-casual", "versatile"}', 'Great for casual Fridays'),
        (test_user_id, 'Black Leather Jacket', 'Jackets', 'Leather Jackets', 'Black', 'AllSaints', 'M', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop', '{"edgy", "casual", "statement"}', 'Weekend statement piece');
    END IF;
END $$;

-- Create sample orders and outfits for trending data using proper UUIDs
-- Add some sample orders to generate trending data
DO $$
DECLARE
    test_user_id UUID;
    order_id UUID;
    product_ids UUID[];
BEGIN
    -- Get the user ID for uscl.bilvalabs@gmail.com
    SELECT id INTO test_user_id FROM auth.users WHERE email = 'uscl.bilvalabs@gmail.com';
    
    -- Get some product IDs for order items
    SELECT ARRAY(SELECT id FROM products LIMIT 5) INTO product_ids;
    
    IF test_user_id IS NOT NULL AND array_length(product_ids, 1) > 0 THEN
        -- Create sample orders for trending analysis
        INSERT INTO orders (id, user_id, status, total_amount, subtotal, shipping_cost, tax_amount, shipping_first_name, shipping_last_name, shipping_address_line1, shipping_city, shipping_state, shipping_postal_code, shipping_country, billing_first_name, billing_last_name, billing_address_line1, billing_city, billing_state, billing_postal_code, billing_country, order_number, created_at) VALUES
        (gen_random_uuid(), test_user_id, 'delivered', 184.99, 169.99, 10.00, 5.00, 'Test', 'User', '123 Main St', 'New York', 'NY', '10001', 'US', 'Test', 'User', '123 Main St', 'New York', 'NY', '10001', 'US', 'MAN-' || to_char(NOW(), 'YYYYMMDD') || '-001', NOW() - INTERVAL '7 days'),
        (gen_random_uuid(), test_user_id, 'delivered', 295.00, 275.00, 15.00, 5.00, 'Test', 'User', '123 Main St', 'New York', 'NY', '10001', 'US', 'Test', 'User', '123 Main St', 'New York', 'NY', '10001', 'US', 'MAN-' || to_char(NOW(), 'YYYYMMDD') || '-002', NOW() - INTERVAL '14 days');
        
        -- Add order items for trending calculation
        FOR order_id IN (SELECT id FROM orders WHERE user_id = test_user_id ORDER BY created_at DESC LIMIT 2) LOOP
            -- Added size column to order_items inserts to fix not-null constraint violation
            INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, size) VALUES
            (order_id, product_ids[1], 1, 89.99, 89.99, 'M'),
            (order_id, product_ids[2], 1, 95.00, 95.00, '32');
        END LOOP;
    END IF;
END $$;

-- Add some public outfits for trending data
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Get the user ID for uscl.bilvalabs@gmail.com
    SELECT id INTO test_user_id FROM auth.users WHERE email = 'uscl.bilvalabs@gmail.com';
    
    IF test_user_id IS NOT NULL THEN
        -- Create sample public outfits
        INSERT INTO outfits (id, user_id, name, description, is_public, created_at) VALUES
        (gen_random_uuid(), test_user_id, 'Business Casual Look', 'Perfect for office meetings and client presentations', true, NOW() - INTERVAL '5 days'),
        (gen_random_uuid(), test_user_id, 'Weekend Casual', 'Relaxed weekend outfit for running errands', true, NOW() - INTERVAL '10 days'),
        (gen_random_uuid(), test_user_id, 'Date Night Style', 'Sophisticated look for dinner dates', true, NOW() - INTERVAL '2 days');
    END IF;
END $$;
