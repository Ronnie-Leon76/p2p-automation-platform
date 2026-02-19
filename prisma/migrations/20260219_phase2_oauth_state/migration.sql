-- Phase 2: OAuth state storage for exchange authorization flow

CREATE TABLE IF NOT EXISTS "oauth_states" (
  "id" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "exchange" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "oauth_states_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "oauth_states_state_key" ON "oauth_states"("state");
CREATE INDEX IF NOT EXISTS "oauth_states_exchange_idx" ON "oauth_states"("exchange");
