-- Migration to properly update users table with exchange information
-- This will be triggered when users first connect their exchange accounts

-- Function to automatically update user exchange info when credentials are saved
CREATE OR REPLACE FUNCTION update_user_exchange_info()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the users table with exchange information when credentials are saved
    UPDATE users
    SET 
        exchange_provider = NEW.exchange,
        exchange_user_id = (
            SELECT (data->>'userId')::text
            FROM user_exchange_data
            WHERE user_id = NEW.user_id
            AND exchange = NEW.exchange
            AND data_type IN ('profile', 'merchant_profile')
            ORDER BY created_at DESC
            LIMIT 1
        ),
        updated_at = NOW()
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on exchange_credentials table
DROP TRIGGER IF EXISTS trigger_update_user_exchange_info ON exchange_credentials;
CREATE TRIGGER trigger_update_user_exchange_info
    AFTER INSERT OR UPDATE ON exchange_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_user_exchange_info();

-- Function to update user exchange info when profile data is cached
CREATE OR REPLACE FUNCTION update_user_from_exchange_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update for profile or merchant_profile data types
    IF NEW.data_type IN ('profile', 'merchant_profile') THEN
        UPDATE users
        SET 
            exchange_provider = NEW.exchange,
            exchange_user_id = (NEW.data->>'userId')::text,
            updated_at = NOW()
        WHERE id = NEW.user_id
        AND (exchange_user_id IS NULL OR exchange_user_id != (NEW.data->>'userId')::text);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on user_exchange_data table
DROP TRIGGER IF EXISTS trigger_update_user_from_exchange_data ON user_exchange_data;
CREATE TRIGGER trigger_update_user_from_exchange_data
    AFTER INSERT OR UPDATE ON user_exchange_data
    FOR EACH ROW
    EXECUTE FUNCTION update_user_from_exchange_data();

-- Add comments for clarity
COMMENT ON FUNCTION update_user_exchange_info() IS 'Automatically updates users table with exchange provider when credentials are saved';
COMMENT ON FUNCTION update_user_from_exchange_data() IS 'Automatically updates users table with exchange user ID when profile data is cached';

-- Index for better performance
CREATE INDEX IF NOT EXISTS idx_users_exchange_lookup ON users(exchange_provider, exchange_user_id) WHERE exchange_user_id IS NOT NULL;
