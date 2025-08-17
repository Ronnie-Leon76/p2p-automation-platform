-- Comprehensive P2P Automation Platform Schema
-- This migration sets up the complete database schema with secure authentication and P2P functionality

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types (with existence checks)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_account_type') THEN
        CREATE TYPE user_account_type AS ENUM ('individual', 'business', 'enterprise');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_tier') THEN
        CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'enterprise');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'team_type') THEN
        CREATE TYPE team_type AS ENUM ('trading', 'arbitrage', 'market_making', 'volume');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exchange_role') THEN
        CREATE TYPE exchange_role AS ENUM ('owner', 'admin', 'manager', 'operator', 'viewer');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM ('pending', 'payment_pending', 'payment_confirmed', 'completed', 'cancelled', 'disputed');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ad_type') THEN
        CREATE TYPE ad_type AS ENUM ('buy', 'sell');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'risk_level') THEN
        CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
    END IF;
END $$;

-- Users table with secure authentication (add missing columns to existing table)
DO $$
BEGIN
    -- Add missing columns to users table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'trader_info') THEN
        ALTER TABLE users ADD COLUMN trader_info JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'completion_rate') THEN
        ALTER TABLE users ADD COLUMN completion_rate DECIMAL(5,4) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'completed_orders') THEN
        ALTER TABLE users ADD COLUMN completed_orders INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_verified_trader') THEN
        ALTER TABLE users ADD COLUMN is_verified_trader BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'user_type') THEN
        ALTER TABLE users ADD COLUMN user_type VARCHAR(20) DEFAULT 'merchant';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'profile_complete') THEN
        ALTER TABLE users ADD COLUMN profile_complete BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'exchange_provider') THEN
        ALTER TABLE users ADD COLUMN exchange_provider VARCHAR(20) DEFAULT 'okx';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'exchange_user_id') THEN
        ALTER TABLE users ADD COLUMN exchange_user_id VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'kyc_level') THEN
        ALTER TABLE users ADD COLUMN kyc_level INTEGER DEFAULT 0;
    END IF;
END $$;

-- Exchange credentials table (user-level API credentials)
CREATE TABLE IF NOT EXISTS exchange_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    exchange VARCHAR(50) NOT NULL, -- 'okx', 'binance', 'bybit', etc.
    api_key TEXT NOT NULL,
    api_secret TEXT NOT NULL,
    passphrase TEXT, -- OKX specific
    testnet BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, exchange)
);

-- Exchange teams for multi-exchange management (add missing columns if needed)
DO $$
BEGIN
    -- Add missing columns to exchange_teams table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exchange_teams' AND column_name = 'automation_settings') THEN
        ALTER TABLE exchange_teams ADD COLUMN automation_settings JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exchange_teams' AND column_name = 'risk_management') THEN
        ALTER TABLE exchange_teams ADD COLUMN risk_management JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exchange_teams' AND column_name = 'trading_pairs') THEN
        ALTER TABLE exchange_teams ADD COLUMN trading_pairs TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- Trader metrics table for performance tracking
CREATE TABLE IF NOT EXISTS trader_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    total_volume DECIMAL(20,8) DEFAULT 0,
    successful_trades INTEGER DEFAULT 0,
    failed_trades INTEGER DEFAULT 0,
    average_completion_time INTEGER DEFAULT 0, -- in minutes
    positive_feedback INTEGER DEFAULT 0,
    negative_feedback INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, metric_date)
);

-- Exchange teams table
CREATE TABLE IF NOT EXISTS exchange_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_name VARCHAR(100) NOT NULL,
    team_type team_type NOT NULL DEFAULT 'trading',
    exchange_name VARCHAR(20) NOT NULL,
    external_team_id VARCHAR(100),
    owner_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exchange team members table
CREATE TABLE IF NOT EXISTS exchange_team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES exchange_teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    exchange_role exchange_role NOT NULL DEFAULT 'viewer',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    can_create_ads BOOLEAN DEFAULT FALSE,
    can_manage_orders BOOLEAN DEFAULT TRUE,
    can_view_analytics BOOLEAN DEFAULT FALSE,
    can_manage_team BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Team exchange credentials (encrypted for shared access)
CREATE TABLE IF NOT EXISTS team_exchange_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES exchange_teams(id) ON DELETE CASCADE,
    exchange_provider VARCHAR(20) NOT NULL,
    owner_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    encrypted_access_token TEXT NOT NULL,
    encrypted_refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    api_permissions TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, exchange_provider)
);

-- Performance tracking and analytics (add missing columns if needed)
DO $$
BEGIN
    -- Add missing columns to trader_metrics table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trader_metrics' AND column_name = 'total_volume') THEN
        ALTER TABLE trader_metrics ADD COLUMN total_volume DECIMAL(20,8) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trader_metrics' AND column_name = 'total_volume_usd') THEN
        ALTER TABLE trader_metrics ADD COLUMN total_volume_usd DECIMAL(15,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trader_metrics' AND column_name = 'average_order_size') THEN
        ALTER TABLE trader_metrics ADD COLUMN average_order_size DECIMAL(15,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trader_metrics' AND column_name = 'completion_rate') THEN
        ALTER TABLE trader_metrics ADD COLUMN completion_rate DECIMAL(5,4) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trader_metrics' AND column_name = 'average_completion_time') THEN
        ALTER TABLE trader_metrics ADD COLUMN average_completion_time DECIMAL(8,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trader_metrics' AND column_name = 'response_time') THEN
        ALTER TABLE trader_metrics ADD COLUMN response_time DECIMAL(8,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trader_metrics' AND column_name = 'rating') THEN
        ALTER TABLE trader_metrics ADD COLUMN rating DECIMAL(3,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trader_metrics' AND column_name = 'positive_feedback') THEN
        ALTER TABLE trader_metrics ADD COLUMN positive_feedback INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trader_metrics' AND column_name = 'negative_feedback') THEN
        ALTER TABLE trader_metrics ADD COLUMN negative_feedback INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trader_metrics' AND column_name = 'neutral_feedback') THEN
        ALTER TABLE trader_metrics ADD COLUMN neutral_feedback INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trader_metrics' AND column_name = 'metric_month') THEN
        ALTER TABLE trader_metrics ADD COLUMN metric_month VARCHAR(7);
    END IF;
END $$;

-- P2P Advertisements
CREATE TABLE IF NOT EXISTS ads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES exchange_teams(id) ON DELETE SET NULL,
  exchange VARCHAR(50) NOT NULL,
  
  -- Ad details
  ad_type ad_type NOT NULL,
  cryptocurrency VARCHAR(10) NOT NULL,
  fiat_currency VARCHAR(10) NOT NULL,
  price DECIMAL(20,8) NOT NULL,
  min_amount DECIMAL(15,2) NOT NULL,
  max_amount DECIMAL(15,2) NOT NULL,
  available_amount DECIMAL(15,2) NOT NULL,
  
  -- Ad settings
  payment_methods TEXT[] DEFAULT '{}',
  payment_time_limit INTEGER DEFAULT 15, -- minutes
  terms_and_conditions TEXT,
  auto_reply_message TEXT,
  
  -- Status and automation
  is_active BOOLEAN DEFAULT TRUE,
  auto_respond BOOLEAN DEFAULT FALSE,
  risk_controls JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- P2P Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_id UUID REFERENCES ads(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Order details
  amount DECIMAL(15,2) NOT NULL,
  price DECIMAL(20,8) NOT NULL,
  total_value DECIMAL(15,2) NOT NULL,
  cryptocurrency VARCHAR(10) NOT NULL,
  fiat_currency VARCHAR(10) NOT NULL,
  
  -- Status tracking
  status order_status DEFAULT 'pending',
  payment_method VARCHAR(100),
  payment_deadline TIMESTAMP WITH TIME ZONE,
  
  -- Order flow timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payment_started_at TIMESTAMP WITH TIME ZONE,
  payment_confirmed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Additional data
  notes TEXT,
  automation_data JSONB DEFAULT '{}'
);

-- Activity logs for audit trail
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES exchange_teams(id) ON DELETE SET NULL,
  action_type VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security audit logs
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  event_details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  risk_level risk_level DEFAULT 'low',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_exchange_credentials_user_id ON exchange_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_exchange_credentials_exchange ON exchange_credentials(exchange);
CREATE INDEX IF NOT EXISTS idx_team_exchange_credentials_team_id ON team_exchange_credentials(team_id);
CREATE INDEX IF NOT EXISTS idx_team_exchange_credentials_exchange ON team_exchange_credentials(exchange_provider);
CREATE INDEX IF NOT EXISTS idx_exchange_team_members_team_id ON exchange_team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_exchange_team_members_user_id ON exchange_team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_trader_metrics_user_id ON trader_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_trader_metrics_date ON trader_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_ads_user_id ON ads(user_id);
CREATE INDEX IF NOT EXISTS idx_ads_exchange ON ads(exchange);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_exchange_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE trader_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (create only if they don't exist)
DO $$
BEGIN
    -- Users can manage their own data
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can manage their own data') THEN
        CREATE POLICY "Users can manage their own data" ON users 
        FOR ALL USING (auth.uid() = id);
    END IF;

    -- Users can manage their own exchange credentials
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'exchange_credentials' AND policyname = 'Users can manage their own exchange credentials') THEN
        CREATE POLICY "Users can manage their own exchange credentials" ON exchange_credentials 
        FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- Team owners can manage their teams
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'exchange_teams' AND policyname = 'Team owners can manage their teams') THEN
        CREATE POLICY "Team owners can manage their teams" ON exchange_teams 
        FOR ALL USING (auth.uid() = owner_id);
    END IF;

    -- Team members can view their teams
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'exchange_teams' AND policyname = 'Team members can view their teams') THEN
        CREATE POLICY "Team members can view their teams" ON exchange_teams 
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM exchange_team_members 
            WHERE team_id = exchange_teams.id 
            AND user_id = auth.uid() 
            AND is_active = TRUE
          )
        );
    END IF;

    -- Team members can view team member data
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'exchange_team_members' AND policyname = 'Team members can view team member data') THEN
        CREATE POLICY "Team members can view team member data" ON exchange_team_members 
        FOR SELECT USING (
          auth.uid() = user_id OR 
          EXISTS (
            SELECT 1 FROM exchange_teams 
            WHERE id = team_id AND owner_id = auth.uid()
          )
        );
    END IF;

    -- Users can view their own metrics
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'trader_metrics' AND policyname = 'Users can view their own metrics') THEN
        CREATE POLICY "Users can view their own metrics" ON trader_metrics 
        FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- Users can manage their own ads
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ads' AND policyname = 'Users can manage their own ads') THEN
        CREATE POLICY "Users can manage their own ads" ON ads 
        FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- Users can view orders they're involved in
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'Users can view their orders') THEN
        CREATE POLICY "Users can view their orders" ON orders 
        FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
    END IF;

    -- Users can view their own activity logs
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'activity_logs' AND policyname = 'Users can view their own activity logs') THEN
        CREATE POLICY "Users can view their own activity logs" ON activity_logs 
        FOR SELECT USING (auth.uid() = user_id);
    END IF;

    -- Users can view their own security logs
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'security_logs' AND policyname = 'Users can view their own security logs') THEN
        CREATE POLICY "Users can view their own security logs" ON security_logs 
        FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at (only create if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_exchange_credentials_updated_at') THEN
        CREATE TRIGGER update_exchange_credentials_updated_at BEFORE UPDATE ON exchange_credentials 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_exchange_teams_updated_at') THEN
        CREATE TRIGGER update_exchange_teams_updated_at BEFORE UPDATE ON exchange_teams 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_team_exchange_credentials_updated_at') THEN
        CREATE TRIGGER update_team_exchange_credentials_updated_at BEFORE UPDATE ON team_exchange_credentials 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_trader_metrics_updated_at') THEN
        CREATE TRIGGER update_trader_metrics_updated_at BEFORE UPDATE ON trader_metrics 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_ads_updated_at') THEN
        CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON ads 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Comments for documentation
COMMENT ON TABLE users IS 'Main users table with authentication and profile data';
COMMENT ON TABLE exchange_credentials IS 'User-level exchange API credentials (encrypted in production)';
COMMENT ON TABLE exchange_teams IS 'Teams for collaborative trading on exchanges';
COMMENT ON TABLE exchange_team_members IS 'Team membership and permissions';
COMMENT ON TABLE team_exchange_credentials IS 'Shared team-level exchange credentials';
COMMENT ON TABLE trader_metrics IS 'Trading performance metrics and analytics';
COMMENT ON TABLE ads IS 'P2P trading advertisements';
COMMENT ON TABLE orders IS 'P2P trading orders and transactions';
COMMENT ON TABLE activity_logs IS 'User activity audit trail';
COMMENT ON TABLE security_logs IS 'Security events and audit trail';
