-- Corrected Migration: Remove OAuth authentication while preserving core P2P automation functionality
-- This migration removes OAuth-specific authentication but keeps exchange teams and trader metrics

-- Remove ONLY OAuth authentication tables (not core functionality tables)
DROP TABLE IF EXISTS oauth_sessions CASCADE;
DROP TABLE IF EXISTS oauth_states CASCADE;
DROP TABLE IF EXISTS exchange_oauth_apps CASCADE;

-- Clean up users table - remove OAuth-specific columns only
ALTER TABLE users 
DROP COLUMN IF EXISTS exchange_access_token,
DROP COLUMN IF EXISTS exchange_refresh_token,
DROP COLUMN IF EXISTS exchange_token_expires_at,
DROP COLUMN IF EXISTS exchange_permissions;

-- Update users table for secure email/password authentication
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
ADD COLUMN IF NOT EXISTS backup_codes TEXT[],
ADD COLUMN IF NOT EXISTS security_questions JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_login_ip INET,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT 'individual' CHECK (account_type IN ('individual', 'business', 'enterprise')),
ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT FALSE;

-- Ensure exchange_teams table exists with proper structure for multi-exchange management
CREATE TABLE IF NOT EXISTS exchange_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_name VARCHAR(100) NOT NULL,
  team_description TEXT,
  team_type VARCHAR(50) DEFAULT 'trading' CHECK (team_type IN ('trading', 'arbitrage', 'market_making', 'volume')),
  exchange_name VARCHAR(50) NOT NULL,
  external_team_id VARCHAR(100), -- Team ID from the exchange
  team_code VARCHAR(20) UNIQUE,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  max_members INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Team settings for automation
  automation_settings JSONB DEFAULT '{}',
  risk_management JSONB DEFAULT '{}',
  trading_pairs TEXT[] DEFAULT '{}',
  
  CONSTRAINT unique_team_per_exchange UNIQUE (team_name, exchange_name)
);

-- Ensure exchange_team_members table exists for team member management
CREATE TABLE IF NOT EXISTS exchange_team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES exchange_teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  exchange_role VARCHAR(50) DEFAULT 'operator' CHECK (exchange_role IN ('owner', 'admin', 'manager', 'operator', 'viewer')),
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

-- Ensure trader_metrics table exists for performance tracking
CREATE TABLE IF NOT EXISTS trader_metrics (
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

-- Create security audit log table
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_description TEXT,
  ip_address INET,
  user_agent TEXT,
  session_id UUID,
  risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enhanced user sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
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

-- Create password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email verification tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
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

-- Create team invitations table (replaces OAuth team sync)
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES exchange_teams(id) ON DELETE CASCADE,
  inviter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  invitee_email VARCHAR(255) NOT NULL,
  invite_code VARCHAR(32) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL,
  permissions TEXT[] DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  declined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create API keys table for programmatic access
CREATE TABLE IF NOT EXISTS api_keys (
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_exchange_teams_owner ON exchange_teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_exchange_teams_exchange ON exchange_teams(exchange_name);
CREATE INDEX IF NOT EXISTS idx_exchange_teams_active ON exchange_teams(is_active);

CREATE INDEX IF NOT EXISTS idx_exchange_team_members_team ON exchange_team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_exchange_team_members_user ON exchange_team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_exchange_team_members_active ON exchange_team_members(is_active);

CREATE INDEX IF NOT EXISTS idx_trader_metrics_user ON trader_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_trader_metrics_team ON trader_metrics(team_id);
CREATE INDEX IF NOT EXISTS idx_trader_metrics_exchange ON trader_metrics(exchange_name);
CREATE INDEX IF NOT EXISTS idx_trader_metrics_date ON trader_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_trader_metrics_month ON trader_metrics(metric_month);

CREATE INDEX IF NOT EXISTS idx_security_audit_user ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_event ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_risk ON security_audit_log(risk_level);
CREATE INDEX IF NOT EXISTS idx_security_audit_created ON security_audit_log(created_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);

-- Create functions for team management
CREATE OR REPLACE FUNCTION generate_team_code()
RETURNS TEXT AS $$
BEGIN
  RETURN UPPER(LEFT(MD5(RANDOM()::TEXT), 8));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_trader_metrics()
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
    NEW.user_id,
    NEW.exchange,
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

-- Create function to set metric_month on insert/update
CREATE OR REPLACE FUNCTION set_metric_month()
RETURNS TRIGGER AS $$
BEGIN
  NEW.metric_month := TO_CHAR(NEW.metric_date, 'YYYY-MM');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up expired tokens
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

-- Trigger to automatically generate team codes
CREATE OR REPLACE FUNCTION set_team_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.team_code IS NULL THEN
    NEW.team_code := generate_team_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_team_code ON exchange_teams;
CREATE TRIGGER trigger_set_team_code
  BEFORE INSERT ON exchange_teams
  FOR EACH ROW
  EXECUTE FUNCTION set_team_code();

-- Trigger to automatically set metric_month
DROP TRIGGER IF EXISTS trigger_set_metric_month ON trader_metrics;
CREATE TRIGGER trigger_set_metric_month
  BEFORE INSERT OR UPDATE OF metric_date ON trader_metrics
  FOR EACH ROW
  EXECUTE FUNCTION set_metric_month();

-- Enable RLS on all tables
ALTER TABLE exchange_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE trader_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for exchange teams (users can see teams they own or are members of)
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

-- Create RLS policies for team members
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

-- Create RLS policies for trader metrics
CREATE POLICY "Users can view their own metrics" ON trader_metrics FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Team owners can view team metrics" ON trader_metrics FOR SELECT
  USING (
    team_id IN (SELECT id FROM exchange_teams WHERE owner_id = auth.uid())
  );

-- Insert default user preferences for existing users
INSERT INTO user_preferences (user_id)
SELECT id FROM users 
WHERE id NOT IN (SELECT user_id FROM user_preferences WHERE user_id IS NOT NULL);

-- Add comments for documentation
COMMENT ON TABLE exchange_teams IS 'Multi-exchange trading teams for P2P automation';
COMMENT ON TABLE exchange_team_members IS 'Team member management with role-based permissions';
COMMENT ON TABLE trader_metrics IS 'Performance tracking and analytics for traders';
COMMENT ON TABLE security_audit_log IS 'Comprehensive security audit trail for all user actions';
COMMENT ON TABLE user_sessions IS 'Enhanced session management with device tracking';
COMMENT ON TABLE password_reset_tokens IS 'Secure password reset token management';
COMMENT ON TABLE email_verification_tokens IS 'Email verification token management';
COMMENT ON TABLE user_preferences IS 'User preferences and settings';
COMMENT ON TABLE team_invitations IS 'Team invitation system replacing OAuth team sync';
COMMENT ON TABLE api_keys IS 'API key management for secure programmatic access';
