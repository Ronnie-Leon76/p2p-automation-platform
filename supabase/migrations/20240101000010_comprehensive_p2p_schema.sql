-- Comprehensive P2P Automation Platform Schema
-- This migration sets up the complete database schema with secure authentication and P2P functionality

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_account_type AS ENUM ('individual', 'business', 'enterprise');
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE team_type AS ENUM ('trading', 'arbitrage', 'market_making', 'volume');
CREATE TYPE exchange_role AS ENUM ('owner', 'admin', 'manager', 'operator', 'viewer');
CREATE TYPE order_status AS ENUM ('pending', 'payment_pending', 'payment_confirmed', 'completed', 'cancelled', 'disputed');
CREATE TYPE ad_type AS ENUM ('buy', 'sell');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');

-- Users table with secure authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  
  -- Exchange credentials (preserved for multi-exchange support)
  exchange_provider VARCHAR(50),
  exchange_user_id VARCHAR(100),
  trader_info JSONB DEFAULT '{}',
  
  -- Security fields
  email_verified BOOLEAN DEFAULT FALSE,
  phone_number VARCHAR(20),
  phone_verified BOOLEAN DEFAULT FALSE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret TEXT,
  backup_codes TEXT[],
  security_questions JSONB DEFAULT '[]',
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  last_login_ip INET,
  password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Account settings
  account_type user_account_type DEFAULT 'individual',
  subscription_tier subscription_tier DEFAULT 'free',
  profile_complete BOOLEAN DEFAULT FALSE,
  
  -- Trading profile
  kyc_level INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,4) DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  is_verified_trader BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exchange teams for multi-exchange management
CREATE TABLE exchange_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_name VARCHAR(100) NOT NULL,
  team_description TEXT,
  team_type team_type DEFAULT 'trading',
  exchange_name VARCHAR(50) NOT NULL,
  external_team_id VARCHAR(100), -- Team ID from the exchange
  team_code VARCHAR(20) UNIQUE,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  max_members INTEGER DEFAULT 10,
  
  -- Team settings for automation
  automation_settings JSONB DEFAULT '{}',
  risk_management JSONB DEFAULT '{}',
  trading_pairs TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_team_per_exchange UNIQUE (team_name, exchange_name)
);

-- Team member management with role-based permissions
CREATE TABLE exchange_team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES exchange_teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  exchange_role exchange_role DEFAULT 'operator',
  permissions TEXT[] DEFAULT '{}',
  
  -- Exchange-specific member data
  exchange_username VARCHAR(100),
  exchange_user_id VARCHAR(100),
  kyc_level INTEGER DEFAULT 0,
  
  -- Status and tracking
  is_active BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE,
  
  -- Performance permissions
  can_create_ads BOOLEAN DEFAULT FALSE,
  can_manage_orders BOOLEAN DEFAULT TRUE,
  can_view_analytics BOOLEAN DEFAULT FALSE,
  can_manage_team BOOLEAN DEFAULT FALSE,
  
  CONSTRAINT unique_user_per_team UNIQUE (team_id, user_id)
);

-- Performance tracking and analytics
CREATE TABLE trader_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES exchange_teams(id) ON DELETE SET NULL,
  exchange_name VARCHAR(50) NOT NULL,
  
  -- Core trading metrics
  total_orders INTEGER DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  cancelled_orders INTEGER DEFAULT 0,
  disputed_orders INTEGER DEFAULT 0,
  
  -- Volume and financial metrics
  total_volume DECIMAL(20,8) DEFAULT 0,
  total_volume_usd DECIMAL(15,2) DEFAULT 0,
  average_order_size DECIMAL(15,2) DEFAULT 0,
  
  -- Performance metrics
  completion_rate DECIMAL(5,4) DEFAULT 0,
  average_completion_time DECIMAL(8,2) DEFAULT 0, -- in minutes
  response_time DECIMAL(8,2) DEFAULT 0, -- in minutes
  
  -- Rating and feedback
  rating DECIMAL(3,2) DEFAULT 0,
  positive_feedback INTEGER DEFAULT 0,
  negative_feedback INTEGER DEFAULT 0,
  neutral_feedback INTEGER DEFAULT 0,
  
  -- Time-based metrics
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metric_month VARCHAR(7),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_exchange_date UNIQUE (user_id, exchange_name, metric_date)
);

-- P2P Advertisements
CREATE TABLE ads (
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
CREATE TABLE orders (
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
  cancellation_reason TEXT,
  dispute_reason TEXT
);

-- Security audit log
CREATE TABLE security_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_description TEXT,
  ip_address INET,
  user_agent TEXT,
  session_id UUID,
  risk_level risk_level DEFAULT 'low',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced user sessions
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  device_info JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email verification tokens
CREATE TABLE email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  theme VARCHAR(20) DEFAULT 'system',
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'UTC',
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  trading_notifications BOOLEAN DEFAULT TRUE,
  security_notifications BOOLEAN DEFAULT TRUE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team invitations
CREATE TABLE team_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES exchange_teams(id) ON DELETE CASCADE,
  inviter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  invitee_email VARCHAR(255) NOT NULL,
  invite_code VARCHAR(32) UNIQUE NOT NULL,
  role exchange_role NOT NULL,
  permissions TEXT[] DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  declined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API keys for programmatic access
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  key_name VARCHAR(100) NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix VARCHAR(10) NOT NULL,
  permissions TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity logs for user actions
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_exchange ON users(exchange_provider, exchange_user_id);
CREATE INDEX idx_users_created ON users(created_at);

CREATE INDEX idx_exchange_teams_owner ON exchange_teams(owner_id);
CREATE INDEX idx_exchange_teams_exchange ON exchange_teams(exchange_name);
CREATE INDEX idx_exchange_teams_active ON exchange_teams(is_active);
CREATE INDEX idx_exchange_teams_code ON exchange_teams(team_code);

CREATE INDEX idx_exchange_team_members_team ON exchange_team_members(team_id);
CREATE INDEX idx_exchange_team_members_user ON exchange_team_members(user_id);
CREATE INDEX idx_exchange_team_members_active ON exchange_team_members(is_active);

CREATE INDEX idx_trader_metrics_user ON trader_metrics(user_id);
CREATE INDEX idx_trader_metrics_team ON trader_metrics(team_id);
CREATE INDEX idx_trader_metrics_exchange ON trader_metrics(exchange_name);
CREATE INDEX idx_trader_metrics_date ON trader_metrics(metric_date);
CREATE INDEX idx_trader_metrics_month ON trader_metrics(metric_month);

CREATE INDEX idx_ads_user ON ads(user_id);
CREATE INDEX idx_ads_team ON ads(team_id);
CREATE INDEX idx_ads_exchange ON ads(exchange);
CREATE INDEX idx_ads_type ON ads(ad_type);
CREATE INDEX idx_ads_active ON ads(is_active);
CREATE INDEX idx_ads_currency ON ads(cryptocurrency, fiat_currency);

CREATE INDEX idx_orders_ad ON orders(ad_id);
CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);

CREATE INDEX idx_security_audit_user ON security_audit_log(user_id);
CREATE INDEX idx_security_audit_event ON security_audit_log(event_type);
CREATE INDEX idx_security_audit_risk ON security_audit_log(risk_level);
CREATE INDEX idx_security_audit_created ON security_audit_log(created_at);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active);

CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);

-- Create utility functions
CREATE OR REPLACE FUNCTION generate_team_code()
RETURNS TEXT AS $$
BEGIN
  RETURN UPPER(LEFT(MD5(RANDOM()::TEXT), 8));
END;
$$ LANGUAGE plpgsql;

-- Function to set metric_month automatically
CREATE OR REPLACE FUNCTION set_metric_month()
RETURNS TRIGGER AS $$
BEGIN
  NEW.metric_month := TO_CHAR(NEW.metric_date, 'YYYY-MM');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update trader metrics when orders change
CREATE OR REPLACE FUNCTION update_trader_metrics_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Update metrics when orders are completed
  INSERT INTO trader_metrics (
    user_id, 
    exchange_name, 
    total_orders, 
    completed_orders,
    metric_date,
    metric_month
  ) VALUES (
    CASE WHEN NEW.status = 'completed' THEN NEW.seller_id ELSE NEW.buyer_id END,
    (SELECT exchange FROM ads WHERE id = NEW.ad_id),
    1,
    CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
    CURRENT_DATE,
    TO_CHAR(CURRENT_DATE, 'YYYY-MM')
  )
  ON CONFLICT (user_id, exchange_name, metric_date)
  DO UPDATE SET
    total_orders = trader_metrics.total_orders + 1,
    completed_orders = trader_metrics.completed_orders + 
      CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
    metric_month = TO_CHAR(trader_metrics.metric_date, 'YYYY-MM'),
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Clean up expired password reset tokens
  DELETE FROM password_reset_tokens WHERE expires_at < NOW() AND used_at IS NULL;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Clean up expired email verification tokens
  DELETE FROM email_verification_tokens WHERE expires_at < NOW() AND verified_at IS NULL;
  
  -- Clean up expired user sessions
  DELETE FROM user_sessions WHERE expires_at < NOW() OR is_active = FALSE;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to set team code automatically
CREATE OR REPLACE FUNCTION set_team_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.team_code IS NULL THEN
    NEW.team_code := generate_team_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_set_team_code ON exchange_teams;
CREATE TRIGGER trigger_set_team_code
  BEFORE INSERT ON exchange_teams
  FOR EACH ROW
  EXECUTE FUNCTION set_team_code();

DROP TRIGGER IF EXISTS trigger_set_metric_month ON trader_metrics;
CREATE TRIGGER trigger_set_metric_month
  BEFORE INSERT OR UPDATE OF metric_date ON trader_metrics
  FOR EACH ROW
  EXECUTE FUNCTION set_metric_month();

DROP TRIGGER IF EXISTS trigger_update_trader_metrics ON orders;
CREATE TRIGGER trigger_update_trader_metrics
  AFTER INSERT OR UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_trader_metrics_on_order();

-- Updated at triggers
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_exchange_teams_updated_at
  BEFORE UPDATE ON exchange_teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_trader_metrics_updated_at
  BEFORE UPDATE ON trader_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_ads_updated_at
  BEFORE UPDATE ON ads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE trader_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON users FOR SELECT
  USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE
  USING (auth.uid() = id);

-- Exchange teams policies
CREATE POLICY "Users can view their teams" ON exchange_teams FOR SELECT
  USING (
    owner_id = auth.uid() OR 
    id IN (SELECT team_id FROM exchange_team_members WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can create teams" ON exchange_teams FOR INSERT
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Team owners can update their teams" ON exchange_teams FOR UPDATE
  USING (owner_id = auth.uid());
CREATE POLICY "Team owners can delete their teams" ON exchange_teams FOR DELETE
  USING (owner_id = auth.uid());

-- Team members policies
CREATE POLICY "Users can view team members of their teams" ON exchange_team_members FOR SELECT
  USING (
    team_id IN (
      SELECT id FROM exchange_teams 
      WHERE owner_id = auth.uid() OR 
      id IN (SELECT team_id FROM exchange_team_members WHERE user_id = auth.uid())
    )
  );
CREATE POLICY "Team owners can manage members" ON exchange_team_members FOR ALL
  USING (
    team_id IN (SELECT id FROM exchange_teams WHERE owner_id = auth.uid())
  );

-- Trader metrics policies
CREATE POLICY "Users can view their own metrics" ON trader_metrics FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Team owners can view team metrics" ON trader_metrics FOR SELECT
  USING (
    team_id IN (SELECT id FROM exchange_teams WHERE owner_id = auth.uid())
  );

-- Ads policies
CREATE POLICY "Users can view all ads" ON ads FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "Users can manage their own ads" ON ads FOR ALL
  USING (user_id = auth.uid());
CREATE POLICY "Team members can manage team ads" ON ads FOR ALL
  USING (
    team_id IN (
      SELECT team_id FROM exchange_team_members 
      WHERE user_id = auth.uid() AND can_create_ads = true
    )
  );

-- Orders policies
CREATE POLICY "Users can view their orders" ON orders FOR SELECT
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());
CREATE POLICY "Users can create orders" ON orders FOR INSERT
  WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());
CREATE POLICY "Users can update their orders" ON orders FOR UPDATE
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Security and session policies
CREATE POLICY "Users can view their own security logs" ON security_audit_log FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Users can view their own sessions" ON user_sessions FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Users can view their own preferences" ON user_preferences FOR ALL
  USING (user_id = auth.uid());
CREATE POLICY "Users can view their own API keys" ON api_keys FOR ALL
  USING (user_id = auth.uid());
CREATE POLICY "Users can view their own activity logs" ON activity_logs FOR SELECT
  USING (user_id = auth.uid());

-- Insert default user preferences for any existing users
INSERT INTO user_preferences (user_id)
SELECT id FROM users 
WHERE id NOT IN (SELECT user_id FROM user_preferences WHERE user_id IS NOT NULL);

-- Add helpful comments
COMMENT ON TABLE users IS 'User accounts with secure authentication and multi-exchange support';
COMMENT ON TABLE exchange_teams IS 'Multi-exchange trading teams for P2P automation';
COMMENT ON TABLE exchange_team_members IS 'Team member management with role-based permissions';
COMMENT ON TABLE trader_metrics IS 'Performance tracking and analytics for traders';
COMMENT ON TABLE ads IS 'P2P advertisements across multiple exchanges';
COMMENT ON TABLE orders IS 'P2P order management and tracking';
COMMENT ON TABLE security_audit_log IS 'Comprehensive security audit trail';
COMMENT ON TABLE user_sessions IS 'Enhanced session management with device tracking';
COMMENT ON TABLE team_invitations IS 'Team invitation system replacing OAuth team sync';
COMMENT ON TABLE api_keys IS 'API key management for secure programmatic access';
