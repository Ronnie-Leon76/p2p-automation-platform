# Supabase Local Development Setup

## Install Supabase CLI

npm install -g supabase@latest

## Initialize Supabase (if not done)

supabase init

## Start local Supabase services

supabase start

## This will start:

# - PostgreSQL Database (localhost:54322)

# - Supabase Studio (localhost:54323)

# - Edge Functions (localhost:54321)

# - Realtime server

# - Storage server

## After starting, update your .env.local with local URLs:

# NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321

# NEXT_PUBLIC_SUPABASE_ANON_KEY=<local_anon_key>

# SUPABASE_SERVICE_ROLE_KEY=<local_service_role_key>

## Apply your database schema

supabase db reset

## Or manually run your SQL files:

# supabase db reset --debug

# supabase migration list
