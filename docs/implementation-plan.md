# Diary — Implementation Plan & Decision Log

Companion to [`requirements.md`](./requirements.md). That document says **what** the product is. This one records **how** we build it, **which** technologies we chose, and **why** — so that a decision made today is not re-argued in three months.

- **Status:** approved, not yet started
- **Date:** 2026-09-17
- **Stack baseline:** Next.js 16.3.5 · React 19.2.8 · TypeScript 5 · Tailwind CSS 4 · pnpm 10.13.1

> **Note on Next.js 16.** This project is on Next 16, which renamed and changed several APIs. Conventions used throughout this plan: `proxy.ts` (not `middleware.ts`), `await params` / `await searchParams`, `await cookies()`, `refresh()` from `next/cache`. Always read `node_modules/next/dist/docs/` before writing code that touches framework APIs.

---

## Part I — Architectural decisions

Each decision is recorded as: what we chose, why, what we rejected, and what it costs us.

### D1 — Database: Neon Postgres + Drizzle ORM

**Decision:** Serverless Postgres on Neon, accessed through Drizzle ORM with `drizzle-kit` migrations.

**Why:**

- The core invariant of this product — *exactly one page per user per calendar date* — is a `UNIQUE (user_id, entry_date)` constraint. The database enforces it; no application code can violate it. In a document store this becomes a race-prone application concern.
- The three access patterns are all relational and all indexed cheaply: fetch one page by `(user_id, date)`, fetch a month's worth of dates, and full-text search a body. Postgres does all three natively.
- Full-text search is built in (`tsvector` + GIN index). No Algolia, no Meilisearch, no second system to secure and keep in sync with a *private* diary.
- Neon's serverless driver works over HTTP, which suits Next.js server runtimes and avoids connection-pool exhaustion.
- Postgres is portable. If Neon ever disappoints, the schema moves to Supabase, RDS, or a VPS unchanged.

**Rejected:**

- **Supabase** — genuinely strong here; RLS would enforce user isolation at the database level. Rejected because we chose a self-hosted auth library (D2) and mixing Supabase Auth's JWTs with a separate session system is friction without payoff. We replicate the isolation guarantee in the Data Access Layer (D4) instead.
- **MongoDB** — flexible body storage is the one thing it wins on, and Postgres `jsonb` already covers that. Date-range and mood queries, the one-page-per-day constraint, and full-text search are all worse.
- **Convex** — excellent DX and live queries, but this app has no realtime requirement (one user, one device at a time), and the proprietary query layer is a hard migration to unwind.

**Cost:** we own migrations, connection handling, and user-isolation correctness ourselves.

### D2 — Auth: Better Auth (self-hosted)

**Decision:** Better Auth, writing its tables into our own Neon database.

**Why:**

- The requirements list email+password, Google OAuth, password reset, persistent sessions, and account deletion. Better Auth ships all of these as first-class, typed features — no hand-rolled reset-token flow.
- Its tables live in **our** database, alongside `entries`. Account deletion is then a single transaction with `ON DELETE CASCADE`, which is exactly what "irreversible after confirm, deletes everything" requires. With a hosted provider, deletion is a two-system dance that can half-fail.
- No per-user pricing, no data leaving our infrastructure — consistent with a product whose first principle is privacy.
- Account linking (Google onto an existing email account) is supported, which settles open question #5.

**Rejected:**

- **Auth.js / NextAuth v5** — Google is easy, but credentials and password reset are deliberately DIY. We would hand-roll exactly the security-sensitive code we want a library for.
- **Clerk** — least work up front, but user records sit outside our DB (complicating cascade deletion), the hosted UI fights our heavily art-directed theming, and it costs money per user for a personal diary.
- **Supabase Auth** — only makes sense paired with D1 = Supabase.

**Cost:** we must configure a transactional email sender for password resets (Resend), and we own session-cookie security settings.

### D3 — Editor: Tiptap

**Decision:** Tiptap (headless ProseMirror) for the writing surface.

**Why:**

- Requirements ask for headings, bold, italic, and lists that are *available but not in the way*. Tiptap gives us a headless editor we style entirely ourselves — essential, because the editor must look like part of each theme, not like a document editor bolted in.
- Markdown-style input rules (`# `, `- `, `> `) give power users formatting without ever opening a toolbar, which serves the "calm writing" principle.
- It stores structured JSON (`jsonb`) **and** can emit plain text — we persist both, so search indexes text while rendering stays rich.
- Mature mobile behaviour (IME, selection, virtual keyboard) — the thing hand-rolled editors always get wrong.

**Rejected:**

- **Lexical** — lighter and faster, but more assembly required and a thinner extension ecosystem.
- **Plain textarea + Markdown** — the calmest and cheapest, and genuinely tempting. Rejected because the requirements explicitly specify rich text with a formatting toolbar.

**Cost:** ~100 KB gzipped on the writing route only. Mitigated by loading the editor exclusively on `/today` and `/day/[date]` (never on Calendar or Search) and by `dynamic()` import below the fold of the first paint.

### D4 — Data access: Server Components + Server Actions, behind a Data Access Layer

**Decision:** All reads happen in Server Components via a `server-only` Data Access Layer. All writes happen through Server Actions that call the same layer. No public REST API.

**Why:**

- Every REST endpoint is a surface that must independently prove it cannot return another user's diary. Zero endpoints is zero such surfaces.
- Server Components mean the diary body never transits as JSON to a client cache, and ship less JS — Today's first paint is HTML.
- Server Actions give a single-roundtrip mutation with built-in CSRF protection and encrypted closures.

**The rule, non-negotiable:**

> Every function in `lib/data/` and every Server Action derives `userId` from the session. `userId` is **never** a function parameter, never a form field, never a URL segment. A Server Action is reachable by direct `POST` — it is an API endpoint, and is authorized like one.

`getSession()` is wrapped in React's `cache()` so one request resolves the session once and shares it across the tree.

**Rejected:** Route Handlers + TanStack Query (more surfaces to guard, more client JS); a hybrid (two conventions to keep consistent for no gain here).

**Cost:** search-as-you-type and similar interactions need `useTransition` plumbing rather than a plain fetch.

### D5 — Dates: server-authoritative, `DATE` column + stored timezone

**Decision:** `entry_date` is a SQL `DATE` (no time, no zone). The user's IANA timezone lives on their profile. The server computes "today" from that stored timezone on every request.

**Why:**

- `DATE` makes the unique constraint exact. A timestamp column would let two midnight-adjacent writes land on different "days" after a DST shift or a flight.
- Client-supplied dates are trivially forged, and the requirements forbid future-dated pages. The future-date check must be server-side to mean anything.
- Server authority means a user's phone and laptop always agree on which page is today.

The browser's timezone is *detected at signup and offered*, never silently trusted thereafter. Changing timezone in Profile is explicit, because it changes which page "today" means.

**Library:** `@date-fns/tz` + `date-fns` for zone-aware civil-date math. No `moment`.

### D6 — Theming: art-directed theme manifests, CSS custom properties, server-resolved

This is the product's differentiating feature and gets the most design budget.

**Decision:** A theme is a **manifest** — a typed object plus a CSS token block plus art assets — not a color swap.

One theme controls:

| Layer | What it sets |
| --- | --- |
| Color | ~14 semantic tokens (surface, raised, ink, ink-muted, accent, accent-ink, line, overlay…), in light **and** dark |
| Type | A per-theme **display** face for dates, month titles, greetings |
| Background | Layered AVIF/WebP artwork, light and dark variants, plus a gradient base |
| Paper | Grain opacity, vignette strength, edge treatment |
| Form | Corner radius scale, border weight, shadow character |
| Motif | A small SVG accent used on the calendar and page header |
| Motion | Entry transition character (settle, drift, fade) |
| Copy | Greeting phrasings and the empty-page prompt for that theme |

**Resolution order** (server-side, per request):

1. **Locked theme** — if the user pinned one, it wins **everywhere, uniformly**. A locked theme means the whole app is one look; the calendar does *not* hint at the season. (Settles open question #10.)
2. **Birthday** — matches the profile's month/day in the user's timezone.
3. **Holiday** — if enabled and in the user's chosen holiday calendar.
4. **Month theme** — the default; twelve of them.

Calendar month view themes to the **month being viewed**; Today themes to **today's date** — unless locked.

**Why CSS custom properties + `data-theme`:**

- The theme is resolved on the server and stamped onto `<html data-theme="october" data-scheme="dark">` in the root layout. There is **no flash of the wrong theme** — the first byte of HTML already carries the right one. A client-side context provider cannot promise this.
- Adding a thirteenth theme is one CSS block plus one registry entry. Zero component changes.
- Tailwind 4's `@theme` reads the same custom properties, so utilities and components stay in sync.

**Why raster art (AVIF/WebP) rather than pure CSS:** we chose the higher visual ceiling deliberately. CSS gradients and SVG grain can be tasteful but always read as *graphic*; real illustrated seasonal artwork is what makes October feel like October. Discipline that buys back the cost:

- Budget: **≤ 120 KB per variant** at 1600 px wide, AVIF with WebP fallback.
- Light and dark variant per theme, served via `next/image`.
- A tiny base64 `blurDataURL` in the manifest so the writing surface never pops in.
- Only the active theme's art is ever requested; it is `priority`-loaded on Today because it *is* the page.
- Until final art exists, each theme ships a layered-CSS placeholder generated from its own tokens. **Theme work is not blocked on artwork.**

**Why shared body font + per-theme display font:** the writing surface should feel familiar every day — you should not have to re-learn how your own diary reads each month. One excellent body serif everywhere; the *date, month title, and greeting* carry the theme's personality. This also keeps the font budget to one small display face per theme.

Mechanically: all display faces are declared with `next/font` and `preload: false`, each exposing its own CSS variable; `[data-theme="x"] { --font-display: var(--font-display-x) }` selects one. Browsers fetch only the `@font-face` actually referenced. Because the active theme is known on the server, the root layout emits an explicit `<link rel="preload">` for that one face.

### D7 — PWA: manifest + minimal service worker

**Decision:** `app/manifest.ts` for installability; a hand-written service worker that caches **only** the app shell and static assets.

**Why:** the requirements state online is required and offline writing is out of scope. A full offline layer would be both wasted work and a privacy regression — caching diary pages leaves a user's writing on disk in the browser cache. The service worker's job is app-shell speed and an honest offline screen, nothing more.

**Explicitly cached:** shell HTML, JS/CSS, fonts, theme art, icons.
**Explicitly never cached:** anything from `/api/auth`, any Server Action response, any entry content.

`theme_color` and the iOS status-bar meta follow the active theme's color where the platform allows.

**Rejected:** Serwist / full offline caching (over-engineered and privacy-adverse here); manifest-only (loses the shell cache that makes launch feel instant).

### D8 — UI components: shadcn/ui, selectively

Copied-in, not installed — so every component can be restyled to consume our theme tokens. Used for the genuinely fiddly primitives (Dialog, Popover, Select, Sheet, Toast, Switch). The Calendar grid, editor chrome, bottom nav, and theme gallery are **custom** — they are the product, and a generic component library would flatten exactly what makes it feel like a diary.

### D9 — Hosting: Vercel

First-party Next.js 16 support, Neon integrates cleanly, HTTPS by default (required for PWA install and secure cookies). Nothing in this architecture is Vercel-specific — it is a standard Node server app and can move.

---

## Part II — Decisions on the requirements' open questions

Answering §16 of `requirements.md`.

| # | Question | Decision |
| --- | --- | --- |
| 1 | Product name | Stays **Diary** for now. Not a build blocker; revisit before launch. |
| 2 | Holiday set | Two curated calendars: **International** (New Year, Valentine's, Halloween, Christmas, New Year's Eve) and **India** (Holi, Raksha Bandhan, Independence Day, Diwali, New Year). User picks: *none*, either, or both. Curated, not exhaustive — a holiday only exists if it has real art. |
| 3 | Mood set | Six, fixed: **Calm · Happy · Low · Anxious · Tired · Grateful.** One optional mood per page. Shown on the calendar as a small tinted dot in the theme's accent family — never as a chart. |
| 4 | Rich text limits | H2, H3, bold, italic, bullet list, ordered list, blockquote. **No** links, tables, images, code blocks. Markdown input rules enabled (`# `, `- `, `1. `, `> `). |
| 5 | Google + email on one account | **Yes.** Better Auth account linking, matched on verified email. |
| 6 | Import conflicts | **Skip by default.** The import preview shows how many dates collide, with an explicit "overwrite existing pages" toggle. Never merges — silently merging two versions of a diary entry is worse than either outcome. |
| 7 | Export formats | **JSON** (lossless, the only format `import` accepts) **and Markdown** (one file per day in a zip, for reading). PDF deferred. |
| 8 | Birthday year | **Optional, and never used to compute age.** Month + day are what the birthday theme needs. |
| 9 | Empty past days | **Tappable.** Any past date opens a writable empty page (backfill). Future dates are visibly disabled and rejected server-side. |
| 10 | Locked theme vs. month | A locked theme applies **uniformly across the whole app**, calendar included. If you locked a theme you love, you want to see it — not a compromise. |

---

## Part III — Data model

### Better Auth tables

`user`, `session`, `account`, `verification` — generated by Better Auth's Drizzle adapter. Not hand-edited.

### `profiles`

| Column | Type | Notes |
| --- | --- | --- |
| `user_id` | `text` PK | FK → `user.id`, `ON DELETE CASCADE` |
| `display_name` | `text` NOT NULL | Greetings |
| `birthday_month` | `smallint` | 1–12, nullable |
| `birthday_day` | `smallint` | 1–31, nullable |
| `birthday_year` | `smallint` | nullable; never used for age |
| `timezone` | `text` NOT NULL | IANA, default `UTC`, detected at signup |
| `theme_mode` | `text` NOT NULL | `auto` \| `locked` |
| `locked_theme_id` | `text` | nullable; required when mode is `locked` |
| `holiday_calendars` | `text[]` NOT NULL | subset of `international`, `india`; empty = off |
| `created_at` / `updated_at` | `timestamptz` | |

### `entries`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `user_id` | `text` NOT NULL | FK → `user.id`, `ON DELETE CASCADE` |
| `entry_date` | `date` NOT NULL | civil date in the user's timezone |
| `body_json` | `jsonb` NOT NULL | Tiptap document |
| `body_text` | `text` NOT NULL | plain-text mirror, for search and word count |
| `word_count` | `integer` NOT NULL | derived on write |
| `mood` | `text` | nullable, one of the six |
| `created_at` / `updated_at` | `timestamptz` NOT NULL | |

Constraints and indexes:

```sql
UNIQUE (user_id, entry_date)                    -- the product's core invariant
INDEX  (user_id, entry_date DESC)               -- calendar + prev/next
GIN    (to_tsvector('english', body_text))      -- search (Phase 8)
CHECK  (mood IN ('calm','happy','low','anxious','tired','grateful'))
```

**Row lifecycle.** A row is created on **first save**, not on page open — opening Today never writes. "Clear" keeps the row but empties `body_json` / `body_text` and nulls `mood`; "Delete" removes the row. Both look identical on the calendar, because *written days* are defined as `word_count > 0`. This satisfies the requirement that a cleared page not look written, while keeping clear/delete distinct actions.

**Future dates** are rejected in the Server Action against the server-computed today, and the API is the only way to write.

---

## Part IV — Application structure

```
app/
  layout.tsx                  fonts, server-resolved data-theme, viewport-fit=cover
  manifest.ts                 PWA manifest
  (auth)/                     no bottom nav
    layout.tsx
    sign-in/  sign-up/  forgot-password/  reset-password/
  (app)/                      session-guarded, bottom nav, theme shell
    layout.tsx
    today/page.tsx
    day/[date]/page.tsx       YYYY-MM-DD
    calendar/page.tsx         month view
    calendar/[year]/page.tsx  year view
    search/page.tsx           Phase 8
    me/page.tsx
    me/themes/page.tsx        theme gallery + lock
    me/account/page.tsx       password, linked accounts, export/import, delete
  api/auth/[...all]/route.ts  Better Auth handler (the only route handler)

proxy.ts                      optimistic cookie-presence redirect only — never authorization

lib/
  db/          schema.ts, index.ts, migrations/
  auth/        server.ts, client.ts
  data/        'server-only' DAL: session.ts, entries.ts, profile.ts
  actions/     'use server': entries.ts, profile.ts, account.ts, backup.ts
  themes/      registry.ts, types.ts, resolve.ts, holidays.ts, tokens.css
  date/        timezone-aware civil-date helpers
components/
  editor/      Tiptap client component, toolbar, autosave indicator
  calendar/    month grid, year grid, day cell
  theme/       ThemeShell, ThemeArt, gallery
  ui/          shadcn primitives
public/themes/<theme-id>/     bg-light.avif, bg-dark.avif, motif.svg
```

**On `proxy.ts`:** it performs one job — redirect a request with no session cookie away from `(app)` routes, and a request with one away from `(auth)` routes. It is a UX optimization. Per the Next.js authentication guide, *real* authorization happens in the DAL on every read and in every Server Action on every write.

---

## Part V — Key mechanisms

### Autosave

The single most important interaction in the product. Requirement: *must not silently drop text, must not hitch the keyboard.*

- Tiptap `onUpdate` pushes into a debouncer: **800 ms idle, 4 s maximum wait** — so a fast continuous writer still gets saved every 4 s.
- The save call runs inside `useTransition`, keeping the editor fully responsive; the keyboard never blocks on the network.
- Visible states: `idle` → `saving` → `saved` (quiet, fades) → `error` (persistent, with Retry).
- `beforeunload` guard while dirty; a flush on `visibilitychange: hidden` (the real-world case — user swipes the app away mid-sentence).
- **Never** `refresh()` on every autosave. The router refresh fires only when `word_count` crosses 0 ↔ >0, since that is the only change the calendar can see.
- **Conflict handling:** the client sends the `updated_at` it last saw. If the server's row is newer (the user wrote on another device), the action returns a conflict instead of overwriting, and the UI offers to reload. Last-write-wins is not acceptable for someone's diary.
- Offline: failed saves are surfaced honestly ("Not saved — you're offline") and retried on `online`. We never render "Saved" for text that is not on the server.

### Theme resolution

`lib/themes/resolve.ts` exports one pure function:

```
resolveTheme(profile, date) → ThemeManifest
```

It is called in `(app)/layout.tsx` for the app chrome, and again by Calendar for the month being displayed. Being pure and dependency-free makes it directly unit-testable: birthday-on-a-holiday, locked-overrides-birthday, leap-day birthdays, and every month boundary.

### Search (Phase 8)

Postgres `to_tsvector` / `plainto_tsquery` against `body_text`, always scoped `WHERE user_id = $session`, with `ts_headline` for snippets. Filters (mood, date range) and sort (newest/oldest) are `WHERE`/`ORDER BY` clauses on the same query, in the Search route's `searchParams` — no separate screens, per the requirements.

### Export / import

- **Export:** a Server Action streams a JSON document (profile + every entry, `body_json` intact) and, separately, a zip of one Markdown file per day. Generated on demand, never stored.
- **Import:** accepts only our own JSON. Parses, validates, shows a preview (*"214 pages · 3 dates already have pages"*) and requires explicit confirmation. Skips conflicts unless overwrite is toggled. Runs in one transaction.

### Account deletion

Typed confirmation → a single transaction deleting the `user` row, with `ON DELETE CASCADE` removing profile, entries, sessions, and OAuth links. No soft delete, no grace period, no recovery. That is what "irreversible" means, and it is the promise the product makes.

---

## Part VI — Build phases

Each phase is independently shippable and leaves the app in a working state.

### Phase 0 — Foundation

Install dependencies (**via `pnpm add`, never by editing `package.json`**): `drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless`, `better-auth`, `zod`, `date-fns`, `@date-fns/tz`.

Set up Neon, `.env.local` + `env.ts` (validated, server-only), Drizzle config and first migration, Tailwind 4 token layer, base `tokens.css`, shadcn init.

Scripts (added with `pnpm pkg set`, never by editing `package.json`):

| Script | Does |
| --- | --- |
| `pnpm db:generate` | Generate a migration from the schema |
| `pnpm db:migrate` | Apply migrations to `DATABASE_URL` |
| `pnpm db:verify` | Apply every migration to a throwaway in-process Postgres (PGlite) and assert the invariants hold — no credentials, no network |
| `pnpm db:auth` | Regenerate `lib/db/auth-schema.ts` from Better Auth |
| `pnpm db:studio` | Drizzle Studio |
| `pnpm typecheck` | `tsc --noEmit` |

`db:verify` exists because the schema carries product rules that a migration file alone cannot prove: one page per user per day, a bare `date` column, mood values, and cascade-on-delete. It asserts each of them, including behaviourally — a duplicate page and an unknown mood must actually be *rejected*, and deleting a user must actually remove their entries. It runs in CI and needs nothing configured.

**Done when:** `pnpm dev` runs, `pnpm db:verify` passes, and a migration applies cleanly to Neon.

### Phase 1 — Auth

Better Auth server + client, Drizzle adapter, email/password, Google OAuth, Resend for reset emails. All four auth screens. `proxy.ts` redirects. `lib/data/session.ts` with `cache()`. Signup captures display name, birthday, and detected timezone.

**Done when:** a user can register, sign out, sign back in on both providers, reset a password, and stay signed in across a restart.

### Phase 2 — Theme engine

`ThemeManifest` type, registry, `resolveTheme` + unit tests, holiday tables, CSS token blocks for 12 months + birthday + holidays, `next/font` display-face wiring with per-theme preload, `ThemeShell` and `ThemeArt` components, server-side `data-theme` stamping.

Ships with **CSS-generated placeholder art**; final artwork drops in later without code changes.

**Done when:** changing the system date changes the app's entire look, with no flash, in both color schemes.

### Phase 3 — Today & the editor

Tiptap with the agreed node set and input rules, hideable toolbar, mood picker, autosave with all states and the conflict check, `saveEntry` / `clearEntry` / `deleteEntry` Server Actions with server-side future-date rejection, themed empty state with a time-of-day greeting.

**Done when:** someone can open the app and write a real diary entry, and it is still there after a hard refresh.

### Phase 4 — Calendar

Month grid with written-day states and mood dots, today marker, birthday and holiday marks, swipe + chevron navigation, year view, per-viewed-month theming (locked theme overrides uniformly), empty past days tappable, future days disabled.

**Done when:** last Tuesday is findable without search.

### Phase 5 — Day pages & navigation

`/day/[date]` read-first with an obvious Edit control, the same editor for past pages, previous/next **written** day (skipping empty dates), clear and delete with confirmation.

### Phase 6 — Profile & theme gallery

Display name, birthday, timezone, holiday calendar toggles. Theme gallery with preview / apply-once / lock / unlock. Password change and Google linking.

### Phase 7 — PWA

`app/manifest.ts`, full icon set, service worker with a shell-only cache and an honest offline screen, iOS Add-to-Home-Screen guidance, safe-area insets, security headers in `next.config.ts`.

**Done when:** it installs on an Android home screen and launches standalone.

### Phase 8 — Search *(deliberately deferred)*

Full-text search, mood and date-range filters, newest/oldest sort. Deferred behind the Today + Calendar loop, which is the product; search only becomes useful once there is a history to search.

### Phase 9 — Backup & account deletion

JSON and Markdown export, JSON import with preview and conflict rules, cascade account deletion.

### Phase 10 — Art, polish, and hardening

Final theme artwork replacing placeholders. Accessibility audit (contrast in **every** theme × both schemes, labelled icon buttons, focus order, desktop keyboard). Performance pass (route JS budgets, art preloading, Lighthouse PWA). Rate limiting on auth and import. Cross-user isolation audit: a scripted check that every DAL function and every Server Action rejects when the session does not own the row.

---

## Part VII — Risks

| Risk | Mitigation |
| --- | --- |
| Theme artwork becomes the schedule bottleneck | Placeholder art generated from tokens ships in Phase 2; real art lands in Phase 10 with no code change |
| Autosave loses text on a flaky mobile connection | Never render "Saved" optimistically; retry on `online`; flush on `visibilitychange`; conflict detection rather than last-write-wins |
| A cross-user leak — the worst possible bug | `userId` only ever from the session; `server-only` DAL; scripted isolation audit in Phase 10 |
| Editor bundle slows the writing screen | Editor loads only on the two writing routes; dynamic import; per-route JS budget |
| Timezone bugs put an entry on the wrong day | `DATE` column, server-authoritative today, unit tests across DST and date-line boundaries |
| Theme art inflates first paint | ≤120 KB budget per variant, AVIF, `blurDataURL`, only the active theme fetched |

---

## Part VIII — Conventions

- **Never edit `package.json` by hand** — use `pnpm add <pkg>`.
- Every file in `lib/data/` starts with `import 'server-only'`.
- Every Server Action begins with a session check, then Zod validation of its input.
- Read `node_modules/next/dist/docs/` before using any framework API — this is Next 16 and conventions have changed.
- No `userId` ever crosses the client boundary as an argument.
- Colors come from tokens. A raw hex in a component is a bug.
