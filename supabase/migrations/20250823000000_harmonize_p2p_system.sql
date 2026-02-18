-- P2P Automation Platform - Comprehensive Schema Migration
-- Date: 2025-08-23
-- Description: Harmonizes all database changes for P2P automation with live exchange data and payment methods

-- =====================================================
-- 1. EXCHANGE DATA CACHING SYSTEM
-- =====================================================

-- Create exchange_data_cache table for caching live API data
CREATE TABLE IF NOT EXISTS exchange_data_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    exchange_name VARCHAR(50) NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique cache entries per user/exchange/type
    UNIQUE(user_id, exchange_name, data_type)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_exchange_data_cache_user_exchange ON exchange_data_cache(user_id, exchange_name);
CREATE INDEX IF NOT EXISTS idx_exchange_data_cache_expires ON exchange_data_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_exchange_data_cache_data_type ON exchange_data_cache(data_type);

-- =====================================================
-- 2. ENHANCED USER PREFERENCES SYSTEM
-- =====================================================

-- Update user_preferences table with comprehensive trading preferences
DROP TABLE IF EXISTS user_preferences;
CREATE TABLE user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Trading Preferences
    preferred_crypto_currencies TEXT[] DEFAULT ARRAY['USDT', 'BTC', 'ETH'],
    preferred_fiat_currencies TEXT[] DEFAULT ARRAY['KES'],
    default_trading_side VARCHAR(10) DEFAULT 'buy' CHECK (default_trading_side IN ('buy', 'sell')),
    auto_accept_orders BOOLEAN DEFAULT false,
    max_concurrent_orders INTEGER DEFAULT 5,
    min_completion_rate DECIMAL(5,2) DEFAULT 90.00,
    
    -- Risk Management
    daily_trading_limit DECIMAL(15,2),
    max_order_value DECIMAL(15,2),
    min_order_value DECIMAL(15,2) DEFAULT 100.00,
    enable_price_alerts BOOLEAN DEFAULT true,
    price_deviation_threshold DECIMAL(5,2) DEFAULT 2.00,
    
    -- Automation Settings
    auto_refresh_interval INTEGER DEFAULT 5, -- minutes
    enable_auto_pricing BOOLEAN DEFAULT false,
    pricing_strategy VARCHAR(20) DEFAULT 'competitive' CHECK (pricing_strategy IN ('competitive', 'aggressive', 'conservative')),
    
    -- Payment Preferences (Updated for SASAPAY integration)
    preferred_payment_methods TEXT[] DEFAULT ARRAY['M-Pesa', 'Airtel Money', 'Bank Transfer'],
    sasapay_paybill_enabled BOOLEAN DEFAULT false,
    sasapay_account_number VARCHAR(50),
    
    -- User Payment Details (for receiving payments from users via SASAPAY)
    sasapay_paybill_number VARCHAR(20), -- Your SASAPAY Paybill number
    sasapay_business_name VARCHAR(100),
    
    -- User Payout Methods (for paying users)
    mpesa_payout_enabled BOOLEAN DEFAULT true,
    mpesa_business_shortcode VARCHAR(20),
    airtel_money_enabled BOOLEAN DEFAULT true,
    airtel_money_merchant_id VARCHAR(50),
    bank_transfer_enabled BOOLEAN DEFAULT true,
    bank_account_details JSONB,
    
    -- Notifications
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    push_notifications BOOLEAN DEFAULT true,
    order_status_notifications BOOLEAN DEFAULT true,
    price_alert_notifications BOOLEAN DEFAULT true,
    
    -- UI/UX Preferences
    theme VARCHAR(10) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
    language VARCHAR(10) DEFAULT 'en',
    currency_display_format VARCHAR(20) DEFAULT 'symbol',
    
    -- Compliance & Verification
    kyc_completed BOOLEAN DEFAULT false,
    kyc_level INTEGER DEFAULT 1,
    terms_accepted_at TIMESTAMP WITH TIME ZONE,
    privacy_policy_accepted_at TIMESTAMP WITH TIME ZONE,
    
    -- Onboarding Status
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_step INTEGER DEFAULT 1,
    profile_completion_percentage INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for user preferences
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_onboarding ON user_preferences(onboarding_completed, onboarding_step);

-- =====================================================
-- 3. PAYMENT METHODS SYSTEM (Enhanced for SASAPAY)
-- =====================================================

-- Create payment_methods table for both incoming and outgoing payments
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Payment Method Details
    method_type VARCHAR(20) NOT NULL CHECK (method_type IN ('sasapay_paybill', 'mpesa', 'airtel_money', 'bank_transfer')),
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('incoming', 'outgoing', 'both')),
    
    -- Method-specific details stored as JSONB for flexibility
    method_details JSONB NOT NULL,
    
    -- Status and verification
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMP WITH TIME ZONE,
    
    -- Display information
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for payment methods
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_type_direction ON payment_methods(method_type, direction);
CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON payment_methods(is_active);

-- =====================================================
-- 4. LIVE ADS DATA SYSTEM
-- =====================================================

-- Create ads table for cached live ads data
CREATE TABLE IF NOT EXISTS ads_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    exchange_name VARCHAR(50) NOT NULL,
    
    -- Original exchange ad data
    exchange_ad_id VARCHAR(100) NOT NULL,
    raw_ad_data JSONB NOT NULL,
    
    -- Processed ad information
    ad_type VARCHAR(10) NOT NULL CHECK (ad_type IN ('buy', 'sell')),
    crypto_currency VARCHAR(20) NOT NULL,
    fiat_currency VARCHAR(20) NOT NULL,
    unit_price DECIMAL(20,8) NOT NULL,
    available_amount DECIMAL(20,8) NOT NULL,
    min_order_size DECIMAL(20,8) NOT NULL,
    max_order_size DECIMAL(20,8) NOT NULL,
    
    -- Payment methods for this ad
    supported_payment_methods TEXT[],
    
    -- Merchant information
    merchant_completion_rate DECIMAL(5,2),
    merchant_completed_orders INTEGER,
    
    -- Status and timing
    status VARCHAR(20) DEFAULT 'active',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique ads per exchange
    UNIQUE(user_id, exchange_name, exchange_ad_id)
);

-- Add indexes for ads cache
CREATE INDEX IF NOT EXISTS idx_ads_cache_user_exchange ON ads_cache(user_id, exchange_name);
CREATE INDEX IF NOT EXISTS idx_ads_cache_currency_pair ON ads_cache(crypto_currency, fiat_currency);
CREATE INDEX IF NOT EXISTS idx_ads_cache_expires ON ads_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_ads_cache_status ON ads_cache(status);

-- =====================================================
-- 5. TRANSACTION MONITORING SYSTEM
-- =====================================================

-- Create transactions table for monitoring payments
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Transaction identification
    transaction_ref VARCHAR(100) UNIQUE NOT NULL,
    external_ref VARCHAR(100), -- Reference from payment provider
    
    -- Transaction details
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('payment_in', 'payment_out', 'crypto_buy', 'crypto_sell')),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    
    -- Payment method used
    payment_method_id UUID REFERENCES payment_methods(id),
    payment_provider VARCHAR(20), -- 'sasapay', 'mpesa', 'airtel', 'bank'
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    
    -- Related order information
    order_id VARCHAR(100),
    exchange_name VARCHAR(50),
    
    -- Timestamps
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_ref ON transactions(transaction_ref);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method ON transactions(payment_method_id);

-- =====================================================
-- 6. SASAPAY INTEGRATION TABLES
-- =====================================================

-- Create sasapay_transactions for SASAPAY-specific tracking
CREATE TABLE IF NOT EXISTS sasapay_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- SASAPAY specific fields
    sasapay_transaction_id VARCHAR(100) UNIQUE,
    paybill_number VARCHAR(20) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    sender_phone VARCHAR(20),
    
    -- Callback data
    callback_data JSONB,
    callback_received_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    sasapay_status VARCHAR(20),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for SASAPAY transactions
CREATE INDEX IF NOT EXISTS idx_sasapay_transactions_transaction_id ON sasapay_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_sasapay_transactions_sasapay_id ON sasapay_transactions(sasapay_transaction_id);
CREATE INDEX IF NOT EXISTS idx_sasapay_transactions_paybill ON sasapay_transactions(paybill_number, account_number);

-- =====================================================
-- 7. EXCHANGE CREDENTIALS (Enhanced)
-- =====================================================

-- Update exchange_credentials table
ALTER TABLE exchange_credentials ADD COLUMN IF NOT EXISTS last_data_sync TIMESTAMP WITH TIME ZONE;
ALTER TABLE exchange_credentials ADD COLUMN IF NOT EXISTS sync_enabled BOOLEAN DEFAULT true;
ALTER TABLE exchange_credentials ADD COLUMN IF NOT EXISTS data_types_enabled TEXT[] DEFAULT ARRAY['balance', 'payment_methods', 'merchant_profile', 'ads'];

-- =====================================================
-- 8. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_exchange_data_cache_updated_at ON exchange_data_cache;
CREATE TRIGGER update_exchange_data_cache_updated_at
    BEFORE UPDATE ON exchange_data_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ads_cache_updated_at ON ads_cache;
CREATE TRIGGER update_ads_cache_updated_at
    BEFORE UPDATE ON ads_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE exchange_data_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sasapay_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exchange_data_cache
DROP POLICY IF EXISTS "Users can view their own exchange data cache" ON exchange_data_cache;
CREATE POLICY "Users can view their own exchange data cache" ON exchange_data_cache
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own exchange data cache" ON exchange_data_cache;
CREATE POLICY "Users can insert their own exchange data cache" ON exchange_data_cache
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own exchange data cache" ON exchange_data_cache;
CREATE POLICY "Users can update their own exchange data cache" ON exchange_data_cache
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own exchange data cache" ON exchange_data_cache;
CREATE POLICY "Users can delete their own exchange data cache" ON exchange_data_cache
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_preferences
DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
CREATE POLICY "Users can view their own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;
CREATE POLICY "Users can insert their own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;
CREATE POLICY "Users can update their own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for payment_methods
DROP POLICY IF EXISTS "Users can view their own payment methods" ON payment_methods;
CREATE POLICY "Users can view their own payment methods" ON payment_methods
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own payment methods" ON payment_methods;
CREATE POLICY "Users can insert their own payment methods" ON payment_methods
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own payment methods" ON payment_methods;
CREATE POLICY "Users can update their own payment methods" ON payment_methods
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own payment methods" ON payment_methods;
CREATE POLICY "Users can delete their own payment methods" ON payment_methods
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for ads_cache
DROP POLICY IF EXISTS "Users can view their own ads cache" ON ads_cache;
CREATE POLICY "Users can view their own ads cache" ON ads_cache
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own ads cache" ON ads_cache;
CREATE POLICY "Users can insert their own ads cache" ON ads_cache
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own ads cache" ON ads_cache;
CREATE POLICY "Users can update their own ads cache" ON ads_cache
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own ads cache" ON ads_cache;
CREATE POLICY "Users can delete their own ads cache" ON ads_cache
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
CREATE POLICY "Users can view their own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;
CREATE POLICY "Users can insert their own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
CREATE POLICY "Users can update their own transactions" ON transactions
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for sasapay_transactions
DROP POLICY IF EXISTS "Users can view their own sasapay transactions" ON sasapay_transactions;
CREATE POLICY "Users can view their own sasapay transactions" ON sasapay_transactions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own sasapay transactions" ON sasapay_transactions;
CREATE POLICY "Users can insert their own sasapay transactions" ON sasapay_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own sasapay transactions" ON sasapay_transactions;
CREATE POLICY "Users can update their own sasapay transactions" ON sasapay_transactions
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 10. INITIAL DATA SETUP
-- =====================================================

-- Insert default payment methods configuration
INSERT INTO payment_methods (user_id, method_type, direction, method_details, display_name, description, is_active)
SELECT 
    auth.uid(),
    'sasapay_paybill',
    'incoming',
    '{"paybill_number": "", "business_name": "", "instructions": "Pay via SASAPAY Paybill"}',
    'SASAPAY Paybill',
    'Users pay you through SASAPAY Paybill service',
    false
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 11. CLEANUP AND OPTIMIZATION
-- =====================================================

-- Create cleanup function for expired cache data
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
    -- Clean up expired exchange data cache
    DELETE FROM exchange_data_cache WHERE expires_at < NOW();
    
    -- Clean up expired ads cache
    DELETE FROM ads_cache WHERE expires_at < NOW();
    
    -- Log cleanup
    RAISE NOTICE 'Cache cleanup completed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a function to calculate profile completion
CREATE OR REPLACE FUNCTION calculate_profile_completion(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    completion_score INTEGER := 0;
    max_score INTEGER := 100;
    user_prefs RECORD;
BEGIN
    SELECT * INTO user_prefs FROM user_preferences WHERE user_id = user_uuid;
    
    IF user_prefs IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Basic preferences (20 points)
    IF array_length(user_prefs.preferred_crypto_currencies, 1) > 0 THEN
        completion_score := completion_score + 10;
    END IF;
    IF array_length(user_prefs.preferred_fiat_currencies, 1) > 0 THEN
        completion_score := completion_score + 10;
    END IF;
    
    -- Trading limits (20 points)
    IF user_prefs.daily_trading_limit IS NOT NULL THEN
        completion_score := completion_score + 10;
    END IF;
    IF user_prefs.max_order_value IS NOT NULL THEN
        completion_score := completion_score + 10;
    END IF;
    
    -- Payment methods (30 points)
    IF user_prefs.sasapay_paybill_enabled THEN
        completion_score := completion_score + 15;
    END IF;
    IF array_length(user_prefs.preferred_payment_methods, 1) > 0 THEN
        completion_score := completion_score + 15;
    END IF;
    
    -- KYC and compliance (30 points)
    IF user_prefs.kyc_completed THEN
        completion_score := completion_score + 20;
    END IF;
    IF user_prefs.terms_accepted_at IS NOT NULL THEN
        completion_score := completion_score + 5;
    END IF;
    IF user_prefs.privacy_policy_accepted_at IS NOT NULL THEN
        completion_score := completion_score + 5;
    END IF;
    
    -- Update the completion percentage
    UPDATE user_preferences 
    SET profile_completion_percentage = completion_score 
    WHERE user_id = user_uuid;
    
    RETURN completion_score;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'P2P Automation Platform database migration completed successfully at %', NOW();
    RAISE NOTICE 'Schema includes: exchange data caching, enhanced user preferences, payment methods, live ads, transactions, and SASAPAY integration';
END $$;
