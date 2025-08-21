-- Creating idempotent script for currency conversion with column existence checks
-- Convert USD prices to INR (1 USD ≈ 83 INR) only for existing columns

DO $$
BEGIN
    -- Update products table price column (exists in schema)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'price'
    ) THEN
        UPDATE products 
        SET price = ROUND(price * 83, 2)
        WHERE price IS NOT NULL AND price > 0;
        
        RAISE NOTICE 'Updated % product prices to INR', (SELECT COUNT(*) FROM products WHERE price IS NOT NULL);
    END IF;

    -- Update order_items table unit_price and total_price columns
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'unit_price'
    ) THEN
        UPDATE order_items 
        SET unit_price = ROUND(unit_price * 83, 2)
        WHERE unit_price IS NOT NULL AND unit_price > 0;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'total_price'
    ) THEN
        UPDATE order_items 
        SET total_price = ROUND(total_price * 83, 2)
        WHERE total_price IS NOT NULL AND total_price > 0;
    END IF;

    -- Update orders table financial columns
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'subtotal'
    ) THEN
        UPDATE orders 
        SET subtotal = ROUND(subtotal * 83, 2)
        WHERE subtotal IS NOT NULL AND subtotal > 0;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'shipping_cost'
    ) THEN
        UPDATE orders 
        SET shipping_cost = ROUND(shipping_cost * 83, 2)
        WHERE shipping_cost IS NOT NULL AND shipping_cost > 0;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'tax_amount'
    ) THEN
        UPDATE orders 
        SET tax_amount = ROUND(tax_amount * 83, 2)
        WHERE tax_amount IS NOT NULL AND tax_amount > 0;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'total_amount'
    ) THEN
        UPDATE orders 
        SET total_amount = ROUND(total_amount * 83, 2)
        WHERE total_amount IS NOT NULL AND total_amount > 0;
    END IF;

    -- Update inspiration_purchases table price column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inspiration_purchases' AND column_name = 'price'
    ) THEN
        UPDATE inspiration_purchases 
        SET price = ROUND(price * 83, 2)
        WHERE price IS NOT NULL AND price > 0;
    END IF;

    -- Update creator_earnings table financial columns
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'creator_earnings' AND column_name = 'total_earnings'
    ) THEN
        UPDATE creator_earnings 
        SET total_earnings = ROUND(total_earnings * 83, 2),
            available_balance = ROUND(available_balance * 83, 2),
            pending_balance = ROUND(pending_balance * 83, 2),
            total_withdrawals = ROUND(total_withdrawals * 83, 2)
        WHERE total_earnings IS NOT NULL;
    END IF;

    RAISE NOTICE 'Currency conversion to INR completed successfully';
END $$;
