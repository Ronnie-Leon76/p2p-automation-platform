-- Add team delegation and credential sharing
ALTER TABLE teams ADD COLUMN IF NOT EXISTS primary_exchange_provider VARCHAR(20);
ALTER TABLE teams ADD COLUMN IF NOT EXISTS uses_shared_credentials BOOLEAN DEFAULT true;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS shared_trading_enabled BOOLEAN DEFAULT true;

-- Team exchange credentials (encrypted)
CREATE TABLE IF NOT EXISTS team_exchange_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
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

-- Team member permissions for using shared credentials
CREATE TABLE IF NOT EXISTS team_member_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
    permission_type VARCHAR(50) NOT NULL, -- 'create_ads', 'manage_orders', 'view_only', etc.
    permission_scope VARCHAR(50) DEFAULT 'all', -- 'all', 'own_ads', 'assigned_orders', etc.
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Track which team credentials are used for operations
CREATE TABLE IF NOT EXISTS team_operation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    performed_by_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    operation_type VARCHAR(50) NOT NULL, -- 'create_ad', 'update_ad', 'create_order', etc.
    exchange_provider VARCHAR(20) NOT NULL,
    external_operation_id VARCHAR(255), -- ad_id, order_id from exchange
    operation_data JSONB,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_exchange_credentials_team_id ON team_exchange_credentials(team_id);
CREATE INDEX IF NOT EXISTS idx_team_exchange_credentials_exchange ON team_exchange_credentials(exchange_provider);
CREATE INDEX IF NOT EXISTS idx_team_member_permissions_member_id ON team_member_permissions(team_member_id);
CREATE INDEX IF NOT EXISTS idx_team_operation_logs_team_id ON team_operation_logs(team_id);
CREATE INDEX IF NOT EXISTS idx_team_operation_logs_user_id ON team_operation_logs(performed_by_user_id);
