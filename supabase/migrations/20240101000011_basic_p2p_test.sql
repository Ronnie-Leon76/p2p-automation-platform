-- Test migration: Basic P2P schema
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table with secure authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  
  -- Exchange credentials (preserved for multi-exchange support)
  exchange_provider VARCHAR(50),
  exchange_user_id VARCHAR(100),
  
  -- Security fields
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exchange teams for multi-exchange management
CREATE TABLE IF NOT EXISTS exchange_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_name VARCHAR(100) NOT NULL,
  exchange_name VARCHAR(50) NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team member management
CREATE TABLE IF NOT EXISTS exchange_team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES exchange_teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  exchange_role VARCHAR(50) DEFAULT 'operator',
  is_active BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_per_team UNIQUE (team_id, user_id)
);

-- Performance tracking
CREATE TABLE IF NOT EXISTS trader_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES exchange_teams(id) ON DELETE SET NULL,
  exchange_name VARCHAR(50) NOT NULL,
  total_orders INTEGER DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,4) DEFAULT 0,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

SELECT 'P2P automation schema created successfully' as status;
