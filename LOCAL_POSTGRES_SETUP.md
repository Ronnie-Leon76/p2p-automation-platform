# Local Postgres + Prisma + Better Auth Setup

This guide is for running the app with the `postgres` backend adapter in local development.

## Why You Are Seeing `DATABASE_URL` Error

If you see:

```text
Environment variable not found: DATABASE_URL
```

Prisma is being used (directly or through Better Auth), but `DATABASE_URL` is not set in your active `.env.local`.

## Local Setup (Windows / PowerShell)

1. Install dependencies:

```powershell
npm install
```

2. Start local Postgres (Docker required):

```powershell
npm run dev:db:up
```

3. Use Postgres env template:

```powershell
Copy-Item .env.postgres.example .env.local -Force
```

4. Generate Prisma client and apply schema:

```powershell
npm run db:generate
npm run db:migrate
```

5. Start app:

```powershell
npm run dev
```

## Local Setup (macOS/Linux)

```bash
npm install
npm run dev:db:up:sh
cp .env.postgres.example .env.local
npm run db:generate
npm run db:migrate
npm run dev
```

## Required Environment Variables (Postgres Adapter)

```env
NEXT_PUBLIC_BACKEND_ADAPTER=postgres
BACKEND_ADAPTER=postgres
DATABASE_URL=postgresql://p2p:p2p_dev_password@localhost:5432/p2p_automation?schema=public
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=replace-with-a-random-32-plus-char-secret
```

## Production Setup (Postgres Adapter)

Set the same adapter variables in your deployment platform, but with production values:

```env
NEXT_PUBLIC_BACKEND_ADAPTER=postgres
BACKEND_ADAPTER=postgres
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<db>?schema=public
BETTER_AUTH_URL=https://your-domain.com
BETTER_AUTH_SECRET=<random-high-entropy-secret>
```

Then run migrations in CI/deploy:

```bash
npm run db:generate
npm run db:deploy
```

## Quick Verification Checklist

1. `echo $env:DATABASE_URL` (PowerShell) prints a non-empty value.
2. `npm run db:generate` succeeds.
3. `npm run db:migrate` succeeds.
4. Signup request no longer fails with `DATABASE_URL` missing.
