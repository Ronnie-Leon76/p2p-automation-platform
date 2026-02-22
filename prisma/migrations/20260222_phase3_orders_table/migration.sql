CREATE TABLE IF NOT EXISTS "orders" (
  "id" TEXT NOT NULL,
  "side" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "payment_status" TEXT,
  "seller_id" TEXT,
  "buyer_id" TEXT,
  "amount_crypto" DECIMAL(20, 8),
  "amount_fiat" DECIMAL(20, 2),
  "crypto_currency" TEXT,
  "fiat_currency" TEXT,
  "unit_price" DECIMAL(20, 8),
  "counterparty_nickname" TEXT,
  "external_order_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "orders_status_created_at_idx"
ON "orders"("status", "created_at");
