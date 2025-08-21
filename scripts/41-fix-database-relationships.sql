-- Fix Database Relationships and Foreign Key Constraints
-- This script ensures all table relationships are properly defined

-- Drop existing foreign key constraints if they exist (to avoid conflicts)
DO $$ 
BEGIN
    -- Drop foreign key constraints that might exist
    ALTER TABLE IF EXISTS orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
    ALTER TABLE IF EXISTS cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_fkey;
    ALTER TABLE IF EXISTS cart_items DROP CONSTRAINT IF EXISTS cart_items_product_id_fkey;
    ALTER TABLE IF EXISTS order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;
    ALTER TABLE IF EXISTS order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;
    ALTER TABLE IF EXISTS outfit_inspirations DROP CONSTRAINT IF EXISTS outfit_inspirations_user_id_fkey;
    ALTER TABLE IF EXISTS inspiration_likes DROP CONSTRAINT IF EXISTS inspiration_likes_user_id_fkey;
    ALTER TABLE IF EXISTS inspiration_likes DROP CONSTRAINT IF EXISTS inspiration_likes_inspiration_id_fkey;
    ALTER TABLE IF EXISTS inspiration_saves DROP CONSTRAINT IF EXISTS inspiration_saves_user_id_fkey;
    ALTER TABLE IF EXISTS inspiration_saves DROP CONSTRAINT IF EXISTS inspiration_saves_inspiration_id_fkey;
    ALTER TABLE IF EXISTS inspiration_product_tags DROP CONSTRAINT IF EXISTS inspiration_product_tags_inspiration_id_fkey;
    ALTER TABLE IF EXISTS inspiration_product_tags DROP CONSTRAINT IF EXISTS inspiration_product_tags_product_id_fkey;
    ALTER TABLE IF EXISTS wishlist DROP CONSTRAINT IF EXISTS wishlist_user_id_fkey;
    ALTER TABLE IF EXISTS wishlist DROP CONSTRAINT IF EXISTS wishlist_product_id_fkey;
    ALTER TABLE IF EXISTS product_reviews DROP CONSTRAINT IF EXISTS product_reviews_user_id_fkey;
    ALTER TABLE IF EXISTS product_reviews DROP CONSTRAINT IF EXISTS product_reviews_product_id_fkey;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Some constraints may not exist, continuing...';
END $$;

-- Add proper foreign key constraints
-- Orders table relationships
ALTER TABLE orders 
ADD CONSTRAINT orders_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Cart items relationships
ALTER TABLE cart_items 
ADD CONSTRAINT cart_items_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE cart_items 
ADD CONSTRAINT cart_items_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Order items relationships
ALTER TABLE order_items 
ADD CONSTRAINT order_items_order_id_fkey 
FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

ALTER TABLE order_items 
ADD CONSTRAINT order_items_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Outfit inspirations relationships
ALTER TABLE outfit_inspirations 
ADD CONSTRAINT outfit_inspirations_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Inspiration interactions relationships
ALTER TABLE inspiration_likes 
ADD CONSTRAINT inspiration_likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE inspiration_likes 
ADD CONSTRAINT inspiration_likes_inspiration_id_fkey 
FOREIGN KEY (inspiration_id) REFERENCES outfit_inspirations(id) ON DELETE CASCADE;

ALTER TABLE inspiration_saves 
ADD CONSTRAINT inspiration_saves_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE inspiration_saves 
ADD CONSTRAINT inspiration_saves_inspiration_id_fkey 
FOREIGN KEY (inspiration_id) REFERENCES outfit_inspirations(id) ON DELETE CASCADE;

-- Product tags relationships
ALTER TABLE inspiration_product_tags 
ADD CONSTRAINT inspiration_product_tags_inspiration_id_fkey 
FOREIGN KEY (inspiration_id) REFERENCES outfit_inspirations(id) ON DELETE CASCADE;

ALTER TABLE inspiration_product_tags 
ADD CONSTRAINT inspiration_product_tags_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Wishlist relationships
ALTER TABLE wishlist 
ADD CONSTRAINT wishlist_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE wishlist 
ADD CONSTRAINT wishlist_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Product reviews relationships
ALTER TABLE product_reviews 
ADD CONSTRAINT product_reviews_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE product_reviews 
ADD CONSTRAINT product_reviews_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- User profiles relationship
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for better performance on foreign key columns
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_outfit_inspirations_user_id ON outfit_inspirations(user_id);
CREATE INDEX IF NOT EXISTS idx_inspiration_likes_user_id ON inspiration_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_inspiration_likes_inspiration_id ON inspiration_likes(inspiration_id);
CREATE INDEX IF NOT EXISTS idx_inspiration_saves_user_id ON inspiration_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_inspiration_saves_inspiration_id ON inspiration_saves(inspiration_id);
CREATE INDEX IF NOT EXISTS idx_inspiration_product_tags_inspiration_id ON inspiration_product_tags(inspiration_id);
CREATE INDEX IF NOT EXISTS idx_inspiration_product_tags_product_id ON inspiration_product_tags(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON wishlist(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Log completion
DO $$ 
BEGIN
    RAISE NOTICE 'Database relationships and foreign key constraints have been successfully created';
END $$;
