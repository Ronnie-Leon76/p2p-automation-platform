-- Sample users for testing
INSERT INTO users (id, email, full_name, provider, email_verified) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'test@example.com', 'Test User', 'email', true),
  ('550e8400-e29b-41d4-a716-446655440001', 'john@example.com', 'John Doe', 'email', true);

-- Sample teams
INSERT INTO teams (id, name, description, owner_id) VALUES
  ('660e8400-e29b-41d4-a716-446655440000', 'Team Alpha', 'Main trading team', '550e8400-e29b-41d4-a716-446655440000'),
  ('660e8400-e29b-41d4-a716-446655440001', 'Team Beta', 'Secondary team', '550e8400-e29b-41d4-a716-446655440001');

-- Sample team members
INSERT INTO team_members (team_id, user_id, role) VALUES
  ('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'owner'),
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'owner');

-- Sample ads
INSERT INTO ads (
  team_id, 
  exchange_name, 
  side, 
  crypto_currency, 
  fiat_currency, 
  unit_price, 
  crypto_amount, 
  min_order_limit, 
  max_order_limit, 
  status, 
  payment_methods, 
  price_margin, 
  created_by
) VALUES
  (
    '660e8400-e29b-41d4-a716-446655440000',
    'okx',
    'buy',
    'USDT',
    'KES',
    128.50,
    1000.00,
    100.00,
    5000.00,
    'active',
    '["M-Pesa", "Bank Transfer"]',
    0.02,
    '550e8400-e29b-41d4-a716-446655440000'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440000',
    'binance',
    'sell',
    'BTC',
    'USD',
    45000.00,
    0.1,
    0.001,
    0.05,
    'active',
    '["PayPal", "Bank Transfer"]',
    0.01,
    '550e8400-e29b-41d4-a716-446655440000'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440001',
    'bybit',
    'buy',
    'ETH',
    'EUR',
    2800.00,
    5.0,
    0.1,
    2.0,
    'paused',
    '["SEPA", "Credit Card"]',
    0.015,
    '550e8400-e29b-41d4-a716-446655440001'
  );
