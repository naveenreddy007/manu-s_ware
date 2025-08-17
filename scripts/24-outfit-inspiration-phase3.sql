-- Phase 3: Affiliate System and Creator Rewards
-- Create affiliate tracking and creator rewards system

-- Add affiliate tracking columns to existing tables
DO $$
BEGIN
    -- Add affiliate columns to inspiration_purchases if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inspiration_purchases' AND column_name = 'commission_rate') THEN
        ALTER TABLE inspiration_purchases ADD COLUMN commission_rate DECIMAL(5,4) DEFAULT 0.05;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inspiration_purchases' AND column_name = 'commission_amount') THEN
        ALTER TABLE inspiration_purchases ADD COLUMN commission_amount DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inspiration_purchases' AND column_name = 'commission_status') THEN
        ALTER TABLE inspiration_purchases ADD COLUMN commission_status TEXT DEFAULT 'pending' CHECK (commission_status IN ('pending', 'approved', 'paid', 'cancelled'));
    END IF;
END $$;

-- Creator earnings tracking table
CREATE TABLE IF NOT EXISTS creator_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    inspiration_id UUID NOT NULL REFERENCES outfit_inspirations(id) ON DELETE CASCADE,
    total_sales DECIMAL(10,2) DEFAULT 0,
    total_commission DECIMAL(10,2) DEFAULT 0,
    pending_commission DECIMAL(10,2) DEFAULT 0,
    paid_commission DECIMAL(10,2) DEFAULT 0,
    last_sale_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(creator_id, inspiration_id)
);

-- Creator payout requests table
CREATE TABLE IF NOT EXISTS creator_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'processing', 'completed', 'cancelled')),
    payment_method TEXT DEFAULT 'bank_transfer',
    payment_details JSONB,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- Creator points/rewards system
CREATE TABLE IF NOT EXISTS creator_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    points INTEGER DEFAULT 0,
    lifetime_points INTEGER DEFAULT 0,
    tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(creator_id)
);

-- Point transactions table
CREATE TABLE IF NOT EXISTS point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'bonus', 'penalty')),
    source TEXT, -- 'sale', 'like', 'share', 'referral', etc.
    reference_id UUID, -- inspiration_id, purchase_id, etc.
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to calculate commission
CREATE OR REPLACE FUNCTION calculate_commission()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate commission amount (5% default)
    NEW.commission_amount = NEW.total_amount * NEW.commission_rate;
    
    -- Update creator earnings
    INSERT INTO creator_earnings (creator_id, inspiration_id, total_sales, total_commission, pending_commission, last_sale_at)
    VALUES (
        (SELECT creator_user_id FROM outfit_inspirations WHERE id = NEW.inspiration_id),
        NEW.inspiration_id,
        NEW.total_amount,
        NEW.commission_amount,
        NEW.commission_amount,
        NOW()
    )
    ON CONFLICT (creator_id, inspiration_id)
    DO UPDATE SET
        total_sales = creator_earnings.total_sales + NEW.total_amount,
        total_commission = creator_earnings.total_commission + NEW.commission_amount,
        pending_commission = creator_earnings.pending_commission + NEW.commission_amount,
        last_sale_at = NOW(),
        updated_at = NOW();
    
    -- Award points for sale (10 points per dollar)
    INSERT INTO point_transactions (creator_id, points, transaction_type, source, reference_id, description)
    VALUES (
        (SELECT creator_user_id FROM outfit_inspirations WHERE id = NEW.inspiration_id),
        FLOOR(NEW.total_amount * 10),
        'earned',
        'sale',
        NEW.id,
        'Commission from outfit inspiration sale'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for commission calculation
DROP TRIGGER IF EXISTS calculate_commission_trigger ON inspiration_purchases;
CREATE TRIGGER calculate_commission_trigger
    BEFORE INSERT ON inspiration_purchases
    FOR EACH ROW
    EXECUTE FUNCTION calculate_commission();

-- Function to update creator points
CREATE OR REPLACE FUNCTION update_creator_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Update creator points balance
    INSERT INTO creator_points (creator_id, points, lifetime_points)
    VALUES (NEW.creator_id, NEW.points, NEW.points)
    ON CONFLICT (creator_id)
    DO UPDATE SET
        points = CASE 
            WHEN NEW.transaction_type = 'earned' OR NEW.transaction_type = 'bonus' THEN creator_points.points + NEW.points
            WHEN NEW.transaction_type = 'redeemed' OR NEW.transaction_type = 'penalty' THEN creator_points.points - ABS(NEW.points)
            ELSE creator_points.points
        END,
        lifetime_points = CASE
            WHEN NEW.transaction_type = 'earned' OR NEW.transaction_type = 'bonus' THEN creator_points.lifetime_points + NEW.points
            ELSE creator_points.lifetime_points
        END,
        tier = CASE
            WHEN creator_points.lifetime_points + CASE WHEN NEW.transaction_type IN ('earned', 'bonus') THEN NEW.points ELSE 0 END >= 10000 THEN 'platinum'
            WHEN creator_points.lifetime_points + CASE WHEN NEW.transaction_type IN ('earned', 'bonus') THEN NEW.points ELSE 0 END >= 5000 THEN 'gold'
            WHEN creator_points.lifetime_points + CASE WHEN NEW.transaction_type IN ('earned', 'bonus') THEN NEW.points ELSE 0 END >= 1000 THEN 'silver'
            ELSE 'bronze'
        END,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for points update
DROP TRIGGER IF EXISTS update_creator_points_trigger ON point_transactions;
CREATE TRIGGER update_creator_points_trigger
    AFTER INSERT ON point_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_creator_points();

-- Enable RLS on new tables
ALTER TABLE creator_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
    -- Creator earnings policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creator_earnings' AND policyname = 'Users can view their own earnings') THEN
        CREATE POLICY "Users can view their own earnings" ON creator_earnings FOR SELECT USING (auth.uid() = creator_id);
    END IF;
    
    -- Creator payouts policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creator_payouts' AND policyname = 'Users can manage their own payouts') THEN
        CREATE POLICY "Users can manage their own payouts" ON creator_payouts FOR ALL USING (auth.uid() = creator_id);
    END IF;
    
    -- Creator points policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creator_points' AND policyname = 'Users can view their own points') THEN
        CREATE POLICY "Users can view their own points" ON creator_points FOR SELECT USING (auth.uid() = creator_id);
    END IF;
    
    -- Point transactions policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'point_transactions' AND policyname = 'Users can view their own transactions') THEN
        CREATE POLICY "Users can view their own transactions" ON point_transactions FOR SELECT USING (auth.uid() = creator_id);
    END IF;
END $$;
