# Diary

A private, phone-first daily diary: one page per day, seasonal themes, calendar, search, backup, and installable PWA.

The implementation follows [docs/implementation-plan.md](docs/implementation-plan.md). Manual service and device checks live in [QA.md](QA.md).

## Stack

- Next.js 16, React 19, TypeScript, Tailwind CSS 4
- Neon Postgres with Drizzle ORM
- Better Auth with email/password and Google OAuth
- Tiptap rich-text editor
- pnpm 10.13.1

## Local setup

1. Install Node 22 and pnpm 10.13.1.
2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Copy `.env.example` to `.env.local` and configure Neon, Better Auth, Google, and Resend.
4. Apply the migrations:

   ```bash
   pnpm db:migrate
   ```

5. Start development:

   ```bash
   pnpm dev
   ```

The local app uses `http://localhost:3000`. `BETTER_AUTH_URL` must match the origin, and Google’s redirect URI must be `http://localhost:3000/api/auth/callback/google`.

## Database workflow

Never edit generated migration metadata manually.

```bash
pnpm db:generate  # generate migration from the Drizzle schema
pnpm db:migrate   # apply migrations to DATABASE_URL
pnpm db:verify    # apply and behavior-check all migrations in PGlite
pnpm db:auth      # regenerate Better Auth's Drizzle schema
pnpm db:studio    # open Drizzle Studio
```

## Verification

Run these before opening a pull request:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm db:verify
pnpm audit:isolation
pnpm audit:behavioral
pnpm check:contrast
pnpm build
pnpm check:budgets
```

The GitHub Actions quality workflow runs the same gates. `check:budgets` checks built editor-route chunks when `.next` exists and enforces the 120 KB limit for final theme art.

## Privacy architecture

- Every diary read and write derives the owner from the server session; `userId` never crosses the client boundary.
- Postgres enforces one entry per user and civil date.
- The service worker caches public shell assets, fonts, icons, and theme art only. It never caches diary navigation responses, APIs, or Server Action writes.
- Entry writes use `updated_at` conflict tokens to prevent silent cross-device overwrites.

## Production and PWA checks

```bash
pnpm build
pnpm start
```

Use the production server for install/offline testing. Auth provider callbacks, password-reset email, physical-device installation, keyboard/focus behavior, and two-device conflicts remain manual checks in [QA.md](QA.md).

Final illustrated backgrounds are intentionally deferred. CSS placeholders ship now; future files belong under `public/themes/<theme-id>/` and are covered by the art budget.
