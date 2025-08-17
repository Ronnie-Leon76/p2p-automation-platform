-- Add user_type field to users table and update team roles
-- This migration adds the new user type system for P2P merchants

-- Add user_type column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) DEFAULT 'merchant' CHECK (user_type IN ('merchant', 'member'));

-- Update existing users to have merchant type (since they are the ones creating accounts initially)
UPDATE users 
SET user_type = 'merchant' 
WHERE user_type IS NULL;

-- Make user_type NOT NULL after setting defaults
ALTER TABLE users 
ALTER COLUMN user_type SET NOT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);

-- Update team_members table to ensure role constraints
-- Note: This assumes your team_members table uses role as VARCHAR
-- Update role constraints if needed
ALTER TABLE team_members 
ADD CONSTRAINT check_team_member_roles 
CHECK (role IN ('owner', 'manager', 'trader', 'analyst', 'viewer'));

-- Add index for better query performance on roles
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role);

-- Create a view for user profiles with type information
CREATE OR REPLACE VIEW user_profiles_with_type AS
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.user_type,
    u.email_verified,
    u.created_at,
    u.updated_at,
    CASE 
        WHEN u.user_type = 'merchant' THEN 'P2P Merchant'
        WHEN u.user_type = 'member' THEN 'Team Member'
        ELSE 'Unknown'
    END as user_type_label
FROM users u;
