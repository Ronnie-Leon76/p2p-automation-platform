-- Phase 2: team tables for API-backed team routes

CREATE TABLE IF NOT EXISTS "teams" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "owner_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "team_members" (
  "id" TEXT NOT NULL,
  "team_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "permissions" JSONB,
  "invited_by" TEXT,
  "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "team_members_team_id_user_id_key"
ON "team_members"("team_id", "user_id");

CREATE INDEX IF NOT EXISTS "team_members_user_id_idx"
ON "team_members"("user_id");

ALTER TABLE "teams"
ADD CONSTRAINT "teams_owner_id_fkey"
FOREIGN KEY ("owner_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "team_members"
ADD CONSTRAINT "team_members_team_id_fkey"
FOREIGN KEY ("team_id") REFERENCES "teams"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "team_members"
ADD CONSTRAINT "team_members_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
