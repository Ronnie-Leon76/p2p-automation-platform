-- Remove password-based authentication columns and add exchange OAuth
ALTER TABLE users 
DROP COLUMN IF EXISTS password_hash,
ADD COLUMN IF NOT EXISTS exchange_provider VARCHAR(50) NOT NULL DEFAULT 'okx',
ADD COLUMN IF NOT EXISTS exchange_user_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS exchange_access_token TEXT,
ADD COLUMN IF NOT EXISTS exchange_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS exchange_token_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS exchange_permissions JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS trader_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS kyc_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS completion_rate DECIMAL(5,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS completed_orders INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_verified_trader BOOLEAN DEFAULT FALSE;

-- Update provider column to be exchange-specific
UPDATE users SET provider = 'okx' WHERE provider = 'email' OR provider = 'google';

-- Exchange OAuth applications table
CREATE TABLE exchange_oauth_apps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exchange_name VARCHAR(50) NOT NULL,
  client_id VARCHAR(255) NOT NULL,
  client_secret_encrypted TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  scopes TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  environment VARCHAR(20) DEFAULT 'production', -- 'sandbox', 'production'
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(exchange_name, environment)
);

-- Exchange trading teams (pulled from exchange APIs)
CREATE TABLE exchange_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exchange_name VARCHAR(50) NOT NULL,
  external_team_id VARCHAR(255) NOT NULL,
  team_name VARCHAR(255) NOT NULL,
  team_type VARCHAR(100), -- 'individual', 'corporate', 'institutional'
  team_status VARCHAR(50) DEFAULT 'active',
  team_permissions JSONB DEFAULT '{}',
  team_metadata JSONB DEFAULT '{}',
  owner_user_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(exchange_name, external_team_id)
);

-- Link users to exchange teams
CREATE TABLE exchange_team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exchange_team_id UUID NOT NULL REFERENCES exchange_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exchange_role VARCHAR(100), -- Role from exchange API
  permissions JSONB DEFAULT '{}',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(exchange_team_id, user_id)
);

-- OAuth sessions for token management
CREATE TABLE oauth_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exchange_name VARCHAR(50) NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  token_type VARCHAR(50) DEFAULT 'Bearer',
  expires_at TIMESTAMP WITH TIME ZONE,
  scopes TEXT[] DEFAULT '{}',
  session_data JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trader performance metrics (synced from exchanges)
CREATE TABLE trader_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exchange_name VARCHAR(50) NOT NULL,
  metric_date DATE NOT NULL,
  total_orders INTEGER DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  cancelled_orders INTEGER DEFAULT 0,
  total_volume DECIMAL(20, 8) DEFAULT 0,
  completion_rate DECIMAL(5,4) DEFAULT 0,
  average_completion_time INTEGER, -- in minutes
  rating DECIMAL(3,2) DEFAULT 0,
  positive_feedback INTEGER DEFAULT 0,
  negative_feedback INTEGER DEFAULT 0,
  metrics_data JSONB DEFAULT '{}',
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, exchange_name, metric_date)
);

-- Insert default OAuth applications (you'll need to register these with exchanges)
INSERT INTO exchange_oauth_apps (exchange_name, client_id, client_secret_encrypted, redirect_uri, scopes, environment) VALUES
('okx', 'your_okx_client_id', 'encrypted_okx_secret', 'https://yourapp.com/auth/okx/callback', ARRAY['read_user', 'read_p2p', 'trade_p2p'], 'production'),
('binance', 'your_binance_client_id', 'encrypted_binance_secret', 'https://yourapp.com/auth/binance/callback', ARRAY['read_user', 'read_p2p', 'trade_p2p'], 'production'),
('bybit', 'your_bybit_client_id', 'encrypted_bybit_secret', 'https://yourapp.com/auth/bybit/callback', ARRAY['read_user', 'read_p2p', 'trade_p2p'], 'production');

-- Indexes for performance
CREATE INDEX idx_users_exchange_provider ON users(exchange_provider);
CREATE INDEX idx_users_exchange_user_id ON users(exchange_user_id);
CREATE INDEX idx_exchange_teams_external_id ON exchange_teams(exchange_name, external_team_id);
CREATE INDEX idx_oauth_sessions_user_exchange ON oauth_sessions(user_id, exchange_name);
CREATE INDEX idx_trader_metrics_user_date ON trader_metrics(user_id, metric_date);

-- RLS Policies
ALTER TABLE exchange_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trader_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their exchange teams" ON exchange_teams
  FOR SELECT USING (
    owner_user_id = auth.uid() OR
    id IN (
      SELECT exchange_team_id FROM exchange_team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their team memberships" ON exchange_team_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their OAuth sessions" ON oauth_sessions
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view their trader metrics" ON trader_metrics
  FOR ALL USING (user_id = auth.uid());
