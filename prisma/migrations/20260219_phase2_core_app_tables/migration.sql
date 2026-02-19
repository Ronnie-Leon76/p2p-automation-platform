-- Phase 2: core app tables required by onboarding/preferences routes

CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT NOT NULL,
  "email" TEXT,
  "full_name" TEXT,
  "user_type" TEXT,
  "profile_complete" BOOLEAN NOT NULL DEFAULT false,
  "exchange_provider" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

CREATE TABLE IF NOT EXISTS "user_preferences" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_preferences_user_id_key" ON "user_preferences"("user_id");

CREATE TABLE IF NOT EXISTS "exchange_credentials" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "exchange" TEXT NOT NULL,
  "api_key" TEXT,
  "api_secret" TEXT,
  "passphrase" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "exchange_credentials_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "exchange_credentials_user_id_exchange_key"
ON "exchange_credentials"("user_id", "exchange");

CREATE TABLE IF NOT EXISTS "user_exchange_data" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "exchange" TEXT NOT NULL,
  "data_type" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_exchange_data_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_exchange_data_user_id_exchange_data_type_key"
ON "user_exchange_data"("user_id", "exchange", "data_type");

CREATE INDEX IF NOT EXISTS "user_exchange_data_user_id_exchange_idx"
ON "user_exchange_data"("user_id", "exchange");

ALTER TABLE "user_preferences"
ADD CONSTRAINT "user_preferences_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "exchange_credentials"
ADD CONSTRAINT "exchange_credentials_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_exchange_data"
ADD CONSTRAINT "user_exchange_data_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
