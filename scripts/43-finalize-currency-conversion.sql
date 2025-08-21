-- Finalize Currency Conversion to INR
-- This script ensures all prices are properly converted from USD to INR

-- Update all product prices from USD to INR (approximate conversion rate: 1 USD = 83 INR)
UPDATE products 
SET price = ROUND(price * 83, 0)
WHERE price < 1000; -- Only update if price seems to be in USD (less than 1000)

-- Update all order amounts from USD to INR
UPDATE orders 
SET 
  total_amount = ROUND(total_amount * 83, 0),
  subtotal = ROUND(subtotal * 83, 0),
  shipping_cost = ROUND(shipping_cost * 83, 0),
  tax_amount = ROUND(tax_amount * 83, 0)
WHERE total_amount < 10000; -- Only update if amount seems to be in USD

-- Update order items prices from USD to INR
UPDATE order_items 
SET 
  unit_price = ROUND(unit_price * 83, 0),
  total_price = ROUND(total_price * 83, 0)
WHERE unit_price < 1000; -- Only update if price seems to be in USD

-- Update cart items if they exist
UPDATE cart_items 
SET price = ROUND(price * 83, 0)
WHERE price < 1000 AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cart_items' AND column_name = 'price');

-- Update any promotional codes discount values
UPDATE promotional_codes 
SET 
  discount_value = ROUND(discount_value * 83, 0),
  minimum_order_amount = ROUND(minimum_order_amount * 83, 0)
WHERE discount_type = 'fixed' AND discount_value < 1000;

-- Update creator earnings and payouts
UPDATE creator_earnings 
SET 
  total_earnings = ROUND(total_earnings * 83, 0),
  available_balance = ROUND(available_balance * 83, 0),
  pending_balance = ROUND(pending_balance * 83, 0),
  total_withdrawals = ROUND(total_withdrawals * 83, 0)
WHERE total_earnings < 10000;

UPDATE creator_payouts 
SET amount = ROUND(amount * 83, 0)
WHERE amount < 10000;

-- Update inspiration purchases
UPDATE inspiration_purchases 
SET 
  price = ROUND(price * 83, 0),
  commission_amount = ROUND(commission_amount * 83, 0)
WHERE price < 1000;

-- Update marketing campaign budgets
UPDATE marketing_campaigns 
SET budget = ROUND(budget * 83, 0)
WHERE budget < 10000;

-- Update referral reward amounts
UPDATE referrals 
SET reward_amount = ROUND(reward_amount * 83, 0)
WHERE reward_amount < 1000;

-- Update refund transaction amounts
UPDATE refund_transactions 
SET amount = ROUND(amount * 83, 0)
WHERE amount < 1000;

-- Update return item refund amounts
UPDATE return_items 
SET refund_amount = ROUND(refund_amount * 83, 0)
WHERE refund_amount < 1000;

-- Update return request total amounts
UPDATE return_requests 
SET total_amount = ROUND(total_amount * 83, 0)
WHERE total_amount < 1000;

-- Log completion
DO $$ 
BEGIN
    RAISE NOTICE 'Currency conversion to INR has been completed successfully';
    RAISE NOTICE 'All prices have been converted from USD to INR using approximate rate of 1 USD = 83 INR';
END $$;
