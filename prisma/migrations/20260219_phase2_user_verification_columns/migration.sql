-- Phase 2: support profile verification metadata on app users

ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "phone" TEXT;

ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "email_verified" BOOLEAN NOT NULL DEFAULT false;
