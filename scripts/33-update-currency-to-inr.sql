-- Creating database migration to update sample data prices to INR
-- Update sample product prices from USD to INR (multiply by ~83 for current exchange rate)
UPDATE products SET price = price * 83 WHERE price < 1000;

-- Update any existing order amounts to INR
UPDATE orders SET total_amount = total_amount * 83 WHERE total_amount < 10000;

-- Update order items prices to INR
UPDATE order_items SET price = price * 83 WHERE price < 1000;

-- Add currency column to track currency type (for future multi-currency support)
ALTER TABLE products ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'INR';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'INR';
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'INR';

-- Update all existing records to use INR
UPDATE products SET currency = 'INR' WHERE currency IS NULL OR currency = 'USD';
UPDATE orders SET currency = 'INR' WHERE currency IS NULL OR currency = 'USD';
UPDATE order_items SET currency = 'INR' WHERE currency IS NULL OR currency = 'USD';
