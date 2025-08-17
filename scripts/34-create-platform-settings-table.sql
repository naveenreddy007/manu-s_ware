-- Create platform_settings table for storing admin configuration
CREATE TABLE IF NOT EXISTS platform_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    CONSTRAINT single_settings_row CHECK (id = 1)
);

-- Create index for faster JSON queries
CREATE INDEX IF NOT EXISTS idx_platform_settings_jsonb ON platform_settings USING GIN (settings);

-- Enable RLS
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access only
CREATE POLICY "Admin can manage platform settings" ON platform_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Insert default settings if none exist
INSERT INTO platform_settings (id, settings) 
VALUES (1, '{}') 
ON CONFLICT (id) DO NOTHING;
