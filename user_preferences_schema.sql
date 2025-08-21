-- User Preferences Table for Trading Profile Completion
-- This table stores user trading preferences required for onboarding completion

CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Trading Settings
    preferred_currencies TEXT[] DEFAULT ARRAY['USDT', 'USD'],
    min_order_amount INTEGER DEFAULT 100,
    max_order_amount INTEGER DEFAULT 10000,
    trading_hours_start TIME DEFAULT '09:00',
    trading_hours_end TIME DEFAULT '18:00',
    auto_accept_orders BOOLEAN DEFAULT false,
    require_kyc_verification BOOLEAN DEFAULT true,
    preferred_payment_methods TEXT[] DEFAULT ARRAY['Bank Transfer'],
    
    -- Notification Settings
    notification_settings JSONB DEFAULT '{
        "email_notifications": true,
        "order_alerts": true,
        "price_alerts": false,
        "system_updates": true
    }',
    
    -- Risk Management
    risk_management JSONB DEFAULT '{
        "max_daily_volume": 50000,
        "max_orders_per_day": 20,
        "enable_stop_loss": true
    }',
    
    -- Profile Information
    bio TEXT DEFAULT '',
    profile_visibility VARCHAR(20) DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private', 'team_only')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(user_id)
);

-- Add profile_complete column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- RLS Policies
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own preferences
CREATE POLICY "Users can view own preferences" ON user_preferences 
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only update their own preferences
CREATE POLICY "Users can update own preferences" ON user_preferences 
    FOR ALL USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
