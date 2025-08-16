-- Return/Refund System Tables
-- Create tables for handling product returns and refund processing

-- Return requests table
CREATE TABLE IF NOT EXISTS return_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'completed', 'cancelled')),
  reason TEXT NOT NULL,
  return_type VARCHAR(20) DEFAULT 'refund' CHECK (return_type IN ('refund', 'exchange', 'store_credit')),
  total_amount DECIMAL(10,2) NOT NULL,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Return items table (specific items being returned)
CREATE TABLE IF NOT EXISTS return_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  return_request_id UUID NOT NULL REFERENCES return_requests(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  reason TEXT,
  condition VARCHAR(20) DEFAULT 'good' CHECK (condition IN ('good', 'damaged', 'defective', 'wrong_item')),
  refund_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Refund transactions table
CREATE TABLE IF NOT EXISTS refund_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  return_request_id UUID NOT NULL REFERENCES return_requests(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payment_method VARCHAR(50),
  transaction_id VARCHAR(100),
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_return_requests_order_id ON return_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_user_id ON return_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_status ON return_requests(status);
CREATE INDEX IF NOT EXISTS idx_return_items_return_request_id ON return_items(return_request_id);
CREATE INDEX IF NOT EXISTS idx_refund_transactions_return_request_id ON refund_transactions(return_request_id);

-- Enable RLS
ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for return_requests
CREATE POLICY "Users can view their own return requests" ON return_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own return requests" ON return_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending return requests" ON return_requests
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Admin policies for return_requests
CREATE POLICY "Admins can view all return requests" ON return_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all return requests" ON return_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for return_items
CREATE POLICY "Users can view their own return items" ON return_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM return_requests 
      WHERE id = return_items.return_request_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create return items for their requests" ON return_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM return_requests 
      WHERE id = return_items.return_request_id AND user_id = auth.uid()
    )
  );

-- Admin policies for return_items
CREATE POLICY "Admins can view all return items" ON return_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for refund_transactions
CREATE POLICY "Users can view their own refund transactions" ON refund_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM return_requests 
      WHERE id = refund_transactions.return_request_id AND user_id = auth.uid()
    )
  );

-- Admin policies for refund_transactions
CREATE POLICY "Admins can manage all refund transactions" ON refund_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Function to update return request timestamp
CREATE OR REPLACE FUNCTION update_return_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for return_requests
CREATE TRIGGER update_return_requests_updated_at
  BEFORE UPDATE ON return_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_return_request_updated_at();
