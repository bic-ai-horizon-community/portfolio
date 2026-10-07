# AI Horizon

The student AI community platform for Biratnagar International College — events, workshops, registrations, and QR-based attendance.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Install dependencies](#1-install-dependencies)
  - [2. Configure environment variables](#2-configure-environment-variables)
  - [3. Set up the database](#3-set-up-the-database)
  - [4. Run the dev server](#4-run-the-dev-server)
- [Environment Variables Reference](#environment-variables-reference)
- [Database & Migrations](#database--migrations)
  - [This project uses `db push`, not `migrate`](#this-project-uses-db-push-not-migrate)
  - [Making a schema change](#making-a-schema-change)
  - [Why not `prisma migrate`?](#why-not-prisma-migrate)
- [Promoting Yourself to Admin](#promoting-yourself-to-admin)
- [Common Commands](#common-commands)
- [Project Structure](#project-structure)
- [Deploying to Cloudflare](#deploying-to-cloudflare)
- [Troubleshooting](#troubleshooting)

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Database | PostgreSQL (Supabase) + Prisma ORM 6 |
| Auth | NextAuth.js 4 — Google OAuth only |
| Storage | Cloudinary (images/video, with HEIC conversion) |
| Styling | CSS Modules + a global design-token stylesheet |
| Runtime | Node.js (dev) · Cloudflare Workers (deploy) |

---

## Prerequisites

- **Node.js 20.9+** — Next 16 requires `>=20.9.0`; verified working on `v24.18.1`
- **npm 10+**
- A **PostgreSQL** database. The project is configured against [Supabase](https://supabase.com), but any Postgres instance works.
- A **Google Cloud OAuth 2.0 Client ID** for sign-in
- A **Cloudinary** account for media uploads

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

`.npmrc` sets `legacy-peer-deps=true`, which is required to resolve the peer ranges between Next 16, React 19, and the QR/scanner packages.

### 2. Configure environment variables

Copy the template and fill in your values:

```bash
cp .env.example .env
```

See [Environment Variables Reference](#environment-variables-reference) for what each one does.

### 3. Set up the database

This project syncs the schema with **`prisma db push`**:

```bash
npx prisma db push
```

That creates the tables and pushes any schema changes. Safe to re-run — it will not drop existing rows.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** `PORT` in `.env` does **not** change the dev server port. Next.js reads the port from the real shell environment at startup, before `.env` is loaded. Use `npm run dev -- -p 4000` to change it.

---

## Environment Variables Reference

Nine variables. All of them are read directly from `process.env`.

### Required

| Variable | Example | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db?sslmode=require` | Postgres connection for the app at runtime. |
| `DIRECT_URL` | `postgresql://user:pass@host:5432/db` | Direct (non-pooled) connection. Prisma uses this for migrations — the Supabase **Session Pooler** on port `6543` does not support DDL. Point this at the direct host on `5432`. |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | Signs the JWT session cookie. Generate a real one — never commit a placeholder. |
| `NEXTAUTH_URL` | `http://localhost:3000` | Canonical app URL. Used by NextAuth for callbacks and as the QR base-URL fallback. Set this to your real domain in production. |
| `GOOGLE_CLIENT_ID` | `xxxx.apps.googleusercontent.com` | Google OAuth client. |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` | Google OAuth client secret. |
| `CLOUDINARY_CLOUD_NAME` | `dgvag6vpl` | Cloudinary account name. |
| `CLOUDINARY_API_KEY` | `124225496523142` | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | `wqg-i5f6...` | Cloudinary API secret — write access to your media library. |
| `ADMIN_PASSWORD` | a strong shared secret | Required to delete an event or workshop. See below. |

### Getting Google OAuth credentials

1. Open [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth 2.0 Client ID** of type *Web application*.
3. Under **Authorized redirect URIs**, add:
   - `http://localhost:3000/api/auth/callback/google` (local)
   - `https://your-domain.com/api/auth/callback/google` (production)
4. Copy the client ID and secret into `.env`.

### `ADMIN_PASSWORD`

This is **not** a login password. Sign-in is Google-only. `ADMIN_PASSWORD` is a second confirmation gate used only when **deleting an event or workshop** — the delete button prompts for it and sends it to the API.

```ts
// src/app/api/events/[id]/route.ts
if (password !== (process.env.ADMIN_PASSWORD || "aihorizon@admin")) {
  return NextResponse.json({ message: "Invalid admin password" }, { status: 401 });
}
```

> ⚠️ Two things to know: the password travels in the URL query string (so it can land in access logs), and there is an **in-code fallback** — if `ADMIN_PASSWORD` is unset, the literal string `aihorizon@admin` is accepted. Always set the variable in production so the fallback is never reachable.

---

## Database & Migrations

### This project uses `db push`, not `migrate`

The database was originally created with `prisma db push`, so there is **no `_prisma_migrations` table** and no migration history. That is intentional — follow the same workflow.

```bash
npx prisma db push          # sync schema → database
```

### Making a schema change

1. Edit `prisma/schema.prisma`
2. Regenerate the client so TypeScript sees the new types:

   ```bash
   npx prisma generate
   ```

3. Push the change:

   ```bash
   npx prisma db push
   ```

   Prisma prints the SQL it intends to run and warns about anything destructive. Read it before confirming.

4. Restart the dev server.

> **Dropping a column is irreversible.** `db push` will ask for confirmation and require `--accept-data-loss` for destructive changes. Confirm you have a backup first — Supabase offers point-in-time recovery on paid plans.

### Why not `prisma migrate`?

`prisma migrate dev` expects a `_prisma_migrations` history table. Since this database has none, it would try to `CREATE TABLE` for all six tables against a database that already has them and fail. If you ever want real migration history, you would need to baseline the existing schema first:

```bash
mkdir -p prisma/migrations/0_init
npx prisma migrate diff \
  --from-url "$DATABASE_URL" \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/0_init/migration.sql
npx prisma migrate resolve --applied 0_init
```

That is a one-time setup. Until then, `db push` is the supported path.

---

## Promoting Yourself to Admin

Every new user is created as `PUBLIC` on first Google sign-in — the `signIn` callback in `src/lib/auth.ts` hardcodes it. There is no seed script and no bootstrap admin, and `/admin/users` (where the role dropdown lives) is itself behind the admin check. So promote yourself directly in the database:

```bash
psql "$DIRECT_URL" -c "UPDATE \"User\" SET role='ADMIN' WHERE email='you@bicnepal.edu.np';"
```

Or without `psql`, any Postgres client works — Supabase dashboard → SQL editor, Table Editor, DBeaver, etc.

**Then sign out and sign back in.** The role is read from the database once, on initial sign-in, and baked into the JWT. Your existing session keeps the old role until the cookie is replaced.

Roles are `PUBLIC` → `MEMBER` → `ADMIN`, checked as `(session.user as any).role !== "ADMIN"` throughout the API routes.

> The admin panel renders a "Desktop Access Only" wall below a certain viewport width (`src/app/admin/layout.tsx`). Use a laptop.

---

## Common Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | `prisma generate` + production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type check |
| `npx prisma db push` | Sync schema → database |
| `npx prisma generate` | Regenerate Prisma Client types |
| `npx prisma studio` | Browse the database in a GUI |
| `npm run deploy` | Build + deploy to Cloudflare Workers |

---

## Project Structure

```
prisma/
  schema.prisma            Data model (PostgreSQL)
  migrations/              Empty by design — see Database & Migrations
src/
  app/
    page.tsx               Landing page
    events/ workshops/     Public listings + detail pages
    dashboard/             Attendee view: registrations, QR codes, attendance
    admin/                 Admin panel (events, workshops, users, QR scanning)
    attendance/            Public QR check-in flow
    register/              Public registration flow
    login/                 Google sign-in
    api/                   Route handlers (auth, events, workshops, upload, …)
  components/
    admin/ dashboard/      Feature-specific components
    events/ home/ layout/  Shared UI
    icons/ seo/ qr/        Icons, JSON-LD, QR helpers
  lib/
    auth.ts                NextAuth config
    prisma.ts              Prisma client singleton
    qr-access.ts           QR visibility rules
    qr-errors.ts           QR error helpers
prisma.config.ts           Prisma CLI config
open-next.config.ts         Cloudflare build config
wrangler.json               Worker name + compatibility flags
```

**Path alias:** `@/*` maps to `./src/*`.

---

## Deploying to Cloudflare

The app deploys to Cloudflare Workers via OpenNext.

```bash
npx wrangler login
npm run deploy
```

Secrets must be set on the Worker, not in `.env`:

```bash
npx wrangler secret put NEXTAUTH_SECRET
npx wrangler secret put DATABASE_URL
npx wrangler secret put DIRECT_URL
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put CLOUDINARY_CLOUD_NAME
npx wrangler secret put CLOUDINARY_API_KEY
npx wrangler secret put CLOUDINARY_API_SECRET
npx wrangler secret put ADMIN_PASSWORD
```

`NEXTAUTH_URL` is not secret — set it as a plain variable.

Add `https://your-worker-domain/api/auth/callback/google` to your Google OAuth client's authorized redirect URIs.

---

## Troubleshooting

**`P3015: Could not find the migration file at migration.sql`**
The migrations directory contains an empty or partial migration folder. This project does not use migration files — remove any leftover directories under `prisma/migrations/` and use `db push`.

**`mode: "insensitive"` type errors (TS2322)**
Your `provider` in `prisma/schema.prisma` is set to something other than `postgresql`. Case-insensitive filters are Postgres-only. Fix the provider and run `npx prisma generate`.

**`P3009: migrate failed` / tables already exist**
You are mixing `db push` and `migrate dev`. This project uses `db push`.

**Port 3000 already in use**
Something else is bound to it. Either stop it, or run `npm run dev -- -p 4000`. Editing `PORT` in `.env` will not help.

**Google sign-in fails silently / redirects to an error**
Check that `NEXTAUTH_URL` matches the origin you're visiting, and that the callback URL for that exact origin is in your Google OAuth client's authorized redirect URIs. `localhost` and `127.0.0.1` are treated as different origins.

**Uploads fail**
Verify the three `CLOUDINARY_*` values. The API secret is required for write access — the read-only key will not work.

**Deleted a file in `git stash` and want it back**
`git stash list` then `git stash pop`.

---

## Notes on the Auth Model

- **Sign-in is Google-only.** There is no password field and no credential provider, despite `bcryptjs` and a `passwordHash` column existing in the schema — neither is wired up. This is dead weight you can remove.
- **The login page says "Restricted to `@bicnepal.edu.np`", but the `signIn` callback does not enforce any domain.** Audience restrictions (`COLLEGE_ONLY` / `PUBLIC_ONLY`) are checked per-event at registration time in the register route handlers instead. So any Google account can sign in; it just cannot register for events restricted to a college domain.
