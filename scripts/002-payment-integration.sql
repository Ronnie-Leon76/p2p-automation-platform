-- Payment providers table
CREATE TABLE payment_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'mobile_money', 'bank', 'crypto'
  country_code VARCHAR(3) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team payment configurations
CREATE TABLE team_payment_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES payment_providers(id),
  merchant_id VARCHAR(255),
  api_key_encrypted TEXT,
  secret_key_encrypted TEXT,
  webhook_secret_encrypted TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, provider_id)
);

-- Payment transactions table
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES payment_providers(id),
  external_transaction_id VARCHAR(255),
  transaction_type VARCHAR(50) NOT NULL, -- 'payment', 'refund', 'chargeback'
  amount DECIMAL(20, 8) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
  payment_method VARCHAR(100),
  payer_phone VARCHAR(20),
  payer_name VARCHAR(255),
  payer_account VARCHAR(255),
  reference_number VARCHAR(255),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  webhook_data JSONB DEFAULT '{}',
  initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment proofs/receipts table
CREATE TABLE payment_proofs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES payment_transactions(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  file_type VARCHAR(50) NOT NULL, -- 'image', 'pdf', 'document'
  file_url TEXT NOT NULL,
  cloudinary_public_id VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(100),
  verification_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook logs for debugging
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES payment_providers(id),
  team_id UUID REFERENCES teams(id),
  transaction_id UUID REFERENCES payment_transactions(id),
  webhook_type VARCHAR(100),
  payload JSONB NOT NULL,
  headers JSONB DEFAULT '{}',
  response_status INTEGER,
  response_body TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default payment providers
INSERT INTO payment_providers (name, type, country_code, currency, config) VALUES
('M-Pesa Kenya', 'mobile_money', 'KEN', 'KES', '{"provider_code": "mpesa_ke", "api_version": "v1"}'),
('M-Pesa Tanzania', 'mobile_money', 'TZA', 'TZS', '{"provider_code": "mpesa_tz", "api_version": "v1"}'),
('I&M Bank C2B', 'bank', 'KEN', 'KES', '{"provider_code": "im_bank", "api_version": "v2"}'),
('Airtel Money', 'mobile_money', 'KEN', 'KES', '{"provider_code": "airtel", "api_version": "v1"}');

-- Indexes for performance
CREATE INDEX idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_external_id ON payment_transactions(external_transaction_id);
CREATE INDEX idx_payment_proofs_transaction_id ON payment_proofs(transaction_id);
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at);

-- RLS Policies
ALTER TABLE team_payment_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team payment config access" ON team_payment_configs
  FOR ALL USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team payment transaction access" ON payment_transactions
  FOR ALL USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team payment proof access" ON payment_proofs
  FOR ALL USING (
    order_id IN (
      SELECT id FROM orders 
      WHERE team_id IN (
        SELECT team_id FROM team_members 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Team webhook log access" ON webhook_logs
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid()
    )
  );
