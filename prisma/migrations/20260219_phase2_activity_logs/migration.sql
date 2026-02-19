-- Phase 2: activity logs table for API-backed logging

CREATE TABLE IF NOT EXISTS "activity_logs" (
  "id" TEXT NOT NULL,
  "team_id" TEXT,
  "user_id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "resource_type" TEXT,
  "resource_id" TEXT,
  "details" JSONB,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "activity_logs_user_id_created_at_idx"
ON "activity_logs"("user_id", "created_at");

CREATE INDEX IF NOT EXISTS "activity_logs_team_id_user_id_idx"
ON "activity_logs"("team_id", "user_id");

CREATE INDEX IF NOT EXISTS "activity_logs_resource_type_resource_id_idx"
ON "activity_logs"("resource_type", "resource_id");

ALTER TABLE "activity_logs"
ADD CONSTRAINT "activity_logs_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
