-- Create addresses table if it doesn't exist
CREATE TABLE IF NOT EXISTS addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(20) DEFAULT 'home' CHECK (type IN ('home', 'work', 'other')),
  is_default BOOLEAN DEFAULT false,
  full_name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) DEFAULT 'India',
  phone VARCHAR(20),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_default ON addresses(user_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_addresses_location ON addresses(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Enable RLS
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "addresses_select_policy" ON addresses;
  DROP POLICY IF EXISTS "addresses_insert_policy" ON addresses;
  DROP POLICY IF EXISTS "addresses_update_policy" ON addresses;
  DROP POLICY IF EXISTS "addresses_delete_policy" ON addresses;

  -- Create new policies
  CREATE POLICY "addresses_select_policy" ON addresses
    FOR SELECT USING (auth.uid() = user_id);

  CREATE POLICY "addresses_insert_policy" ON addresses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "addresses_update_policy" ON addresses
    FOR UPDATE USING (auth.uid() = user_id);

  CREATE POLICY "addresses_delete_policy" ON addresses
    FOR DELETE USING (auth.uid() = user_id);
END $$;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_addresses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_addresses_updated_at_trigger ON addresses;
CREATE TRIGGER update_addresses_updated_at_trigger
  BEFORE UPDATE ON addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_addresses_updated_at();

DO $$ 
BEGIN
  RAISE NOTICE 'Addresses table and functionality created successfully';
END $$;
