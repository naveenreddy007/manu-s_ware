-- Mobile Navigation and Micro-Transaction Support

-- Payment sessions table for quick payments
CREATE TABLE IF NOT EXISTS payment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('quick_pay', 'cart_checkout', 'subscription', 'top_up')),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  payment_gateway VARCHAR(50),
  gateway_session_id VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour')
);

-- Notifications table for mobile push notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'general' CHECK (type IN ('order', 'payment', 'recommendation', 'promotion', 'system', 'general')),
  read BOOLEAN DEFAULT FALSE,
  action_url VARCHAR(500),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences for mobile experience
CREATE TABLE IF NOT EXISTS user_mobile_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  push_notifications BOOLEAN DEFAULT TRUE,
  quick_pay_enabled BOOLEAN DEFAULT TRUE,
  preferred_quick_amounts INTEGER[] DEFAULT '{10,25,50,100,250,500}',
  haptic_feedback BOOLEAN DEFAULT TRUE,
  dark_mode_preference VARCHAR(20) DEFAULT 'system' CHECK (dark_mode_preference IN ('light', 'dark', 'system')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_sessions_user_id ON payment_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_status ON payment_sessions(status);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_expires_at ON payment_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- RLS Policies
ALTER TABLE payment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mobile_preferences ENABLE ROW LEVEL SECURITY;

-- Users can manage their own payment sessions
DROP POLICY IF EXISTS "Users can manage their own payment sessions" ON payment_sessions;
CREATE POLICY "Users can manage their own payment sessions" ON payment_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Users can manage their own notifications
DROP POLICY IF EXISTS "Users can manage their own notifications" ON notifications;
CREATE POLICY "Users can manage their own notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- Users can manage their own mobile preferences
DROP POLICY IF EXISTS "Users can manage their own mobile preferences" ON user_mobile_preferences;
CREATE POLICY "Users can manage their own mobile preferences" ON user_mobile_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  target_user_id UUID,
  notification_title VARCHAR(255),
  notification_message TEXT,
  notification_type VARCHAR(50) DEFAULT 'general',
  action_url VARCHAR(500) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    action_url
  ) VALUES (
    target_user_id,
    notification_title,
    notification_message,
    notification_type,
    action_url
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(
  target_user_id UUID,
  notification_ids UUID[] DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  IF notification_ids IS NULL THEN
    -- Mark all notifications as read for user
    UPDATE notifications 
    SET read = TRUE, updated_at = NOW()
    WHERE user_id = target_user_id AND read = FALSE;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
  ELSE
    -- Mark specific notifications as read
    UPDATE notifications 
    SET read = TRUE, updated_at = NOW()
    WHERE user_id = target_user_id 
      AND id = ANY(notification_ids) 
      AND read = FALSE;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
  END IF;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create default mobile preferences for existing users
INSERT INTO user_mobile_preferences (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_mobile_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- Wrapped RAISE statement in DO block to fix PostgreSQL syntax error
DO $$
BEGIN
  RAISE NOTICE 'Mobile navigation and micro-transaction support completed successfully!';
END $$;
