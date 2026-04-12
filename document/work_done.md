# Work Done

Date: 2026-02-03

## Current Status (as of 2026-03-17)
- **Frontend scaffold**: Next.js (App Router) + Tailwind set up; base styling + fonts; route skeletons exist for login, vehicles, booking/calendar, log, admin.
- **Env handling**: `src/lib/env.ts` fixed to avoid TS narrowing issues in deploy builds; `.env.example` added; `.env.local` kept gitignored (Vercel env vars still need to be set).
- **Product decisions captured**: Supabase Auth as credential source of truth; hard delete for members/vehicles; no `password_hash` / no `deleted_at`; bookings support all-day; cancellation rules; override notifications in scope; logs retain 30 days.
- **Database**: Initial Supabase migration and seed added (`supabase/migrations/0001_init_schema.sql`, `supabase/seed.sql`) with audit-safe logging (nullable FKs + snapshot JSON).

## Resources Read
- `README.md`
- `guides/vehicle_calendar_blueprint.txt`
- `guides/vehicle_calendar_guideline.txt`
- `document/srs/SRS_v01.docx` (text extracted)

## Notes / Decisions (User Clarifications)
- Log retention is **30 days** (not 3). SRS had an error; user will correct.
- **Permanent deletion** for members and vehicles (not soft delete). Schema/docs should not use `deleted_at` for these records.
- **Override notifications are in scope** and must be sent when a booking is overridden.
- Members **cannot cancel** once a booking has started; cancellation allowed only **before** start time.
- **All-day bookings** must be available.
- **Supabase Auth** is the source of truth for credentials. Application user data lives in `public.users`; keep member `name` unique as the user-facing login identifier, and do not store `password_hash` in the app schema.
- Keep booking time fields as **`date + start_time + end_time`**.
- For hard delete safety, logs should keep **nullable foreign keys** and **snapshot data** so audit entries survive deleted users, vehicles, or bookings.

## Limitations Encountered
- `document/ui_wireframes/ui_wireframe_handsketch.pdf` could not be read due to missing PDF rendering tools; file appears to be image-only.

## Update
Timestamp: 2026-02-03 15:15:37 +0530

- Confirmed git repo and checked status.
- Created `dev` branch.
- Added `.gitignore` for Node/Next.js artifacts and env/log files.
- Updated `README.md` with FleetTime name, description, tech stack, setup commands, and env placeholders.

## Update
Timestamp: 2026-02-03 15:35:15 +0530

- Installed Node.js and npm via apt-get (Node v18.19.1, npm 9.2.0) after create-next-app required Node.
- create-next-app (latest) requires Node >=20.9.0 (engine warning shown).
- Generated a Next.js + Tailwind + App Router + src-dir template in a temporary folder to avoid non-empty repo root restriction, then copied the scaffold into the repo root.
- Updated `.gitignore` to include Next.js defaults plus required Node/Next entries.
- Attempted `npm install` twice; both failed with `ERR_SOCKET_TIMEOUT` despite npm registry reachable via `npm ping`.
- Dev server not started because dependencies could not be installed.

## Files Added From Scaffold (root)
- `eslint.config.mjs`
- `next-env.d.ts`
- `next.config.ts`
- `package.json`
- `postcss.config.mjs`
- `tsconfig.json`
- `public/`
- `src/`

## Update
Timestamp: 2026-02-03 15:37:54 +0530

- Added NodeSource repo for Node.js 20.x.
- Upgraded Node to v20.20.0 and npm to 10.8.2.

## Update
Timestamp: 2026-02-03 15:54:45 +0530

- Removed `node_modules` and `package-lock.json` after ENOTEMPTY error.
- `npm install` completed successfully (357 packages, 0 vulnerabilities).
- Ran `npm run dev`; Next.js started successfully on http://localhost:3000 and was ready in 9.8s.
- Stopped the dev server after confirming it started.

## Update
Timestamp: 2026-02-03 16:22:27 +0530

- Swapped default fonts to Inter (body) and Montserrat (headings/buttons) via `next/font/google`.
- Added design tokens in `globals.css` and applied global background/text colors.
- Added reusable `.app-container` class for max-width and horizontal padding.

## Update
Timestamp: 2026-02-03 16:32:02 +0530

- Added App Router route skeletons for login, vehicles, booking calendar/date, log, and admin sections.
- Introduced `TopBar` and `FloatingLogButton` components.
- Added member/admin layouts to reuse the top bar and apply consistent page structure.
- Added floating Log button on vehicles, calendar, and booking pages.

## Update
Timestamp: 2026-02-03 16:41:22 +0530

- Added `.env.example` with Supabase public placeholders.
- Ensured `.env.local` is gitignored.
- Added `src/lib/env.ts` helper to read env vars and throw only when accessed.
- Updated README with env setup steps.

## Update
Timestamp: 2026-03-17 15:55:02 +0530

- Reviewed the repository end to end to separate the intended product scope from the current implementation state.
- Diagnosed the Vercel deployment failure in `src/lib/env.ts` as a TypeScript narrowing issue, not a missing-Supabase-project issue.
- Replaced the aggregate missing-env check with explicit guards for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` so the return type narrows to plain `string`.
- Verified the fix locally with `./node_modules/.bin/tsc --noEmit` (passed).
- Confirmed `.env.local` already contains non-placeholder Supabase public values locally; these still need to be configured in Vercel environment variables for deployment.

## Update
Timestamp: 2026-03-17 17:44:01 +0530

- Aligned the Phase 1 guideline with the clarified architecture: Supabase Auth-backed users, hard delete for members/vehicles, and no `password_hash` or `deleted_at` in application tables.
- Added the initial Supabase schema migration at `supabase/migrations/0001_init_schema.sql`.
- Added the initial seed file at `supabase/seed.sql`.
- Chose the safer audit approach for logs: nullable foreign keys plus `snapshot` JSON so logs remain useful after hard deletes.

## Update
Timestamp: 2026-03-17 18:02:50 +0530

- Kept `public.users.name` as the unique, user-facing login identifier for the project.
- Decided not to add a separate `display_name` field because it would duplicate the same value for now.
- Clarified in project docs that Supabase Auth may still use an internal email behind the scenes while the UI continues to use name + password.

## Update
Timestamp: 2026-03-17 21:31:42 +0530

- Added a top-level "Current Status (as of 2026-03-17)" summary to make the overall project state easy to scan.
- Moved `work_done.md` into `document/work_done.md` so project documentation stays consolidated in one place.

## Update
Timestamp: 2026-03-17 22:42:00 +0530

- Created comprehensive `document/UI/UI_Guideline.md` defining typography, color palette, adaptive components, and booking status indicators.
- Created `document/UI/UI_Anti_Patterns.md` outlining strict directives for AI/devs (no heavy external libraries, no inline styles, no desktop-only paradigms on mobile).
- Created `document/UX/UX_Guideline.md` defining interactions (hamburger menu, 2-minute polling for live data, frictionless single-click booking, bulk admin Request List).
- Created `document/UX/UX_Anti_Patterns.md` forbidding confusing navigation traps, complex state management, heavy confirmation modals, and persistent blocking banners.

## Update
Timestamp: 2026-04-12 09:03:00 +0530

### Authentication System Implemented

Implemented the full name + password authentication system backed by Supabase Auth.
Users log in with their display name (not an email); the name is deterministically converted
to an internal email (`slug--hash@auth.fleettime.local`) so Supabase's email+password
auth can be used transparently.

**New files created:**
- `src/lib/auth/user.ts` — `AppUser` type, `getCurrentAppUserState`, `requireCurrentAppUser`, `requireAdminAppUser`, `getPostLoginPath`, and `getLoginErrorMessage` helpers.
- `src/lib/auth/name-login.ts` — `buildInternalAuthEmail` converts a user's display name to a deterministic Supabase-compatible email.
- `src/lib/supabase/server.ts` — SSR Supabase client using cookie-based sessions (via `@supabase/ssr`).
- `src/lib/supabase/client.ts` — Browser Supabase client.
- `src/lib/supabase/proxy.ts` — `updateSession()` for use in middleware to keep Supabase sessions alive.
- `src/app/(public)/login/actions.ts` — Server Action `logInWithName`: validates name + password, builds internal email, signs in via Supabase, checks `is_active`, then redirects based on role.
- `src/app/auth/logout/route.ts` — Route handler for `GET /auth/logout` and `POST /auth/logout`; signs out and redirects to `/login` with an optional error reason.
- `middleware.ts` — Next.js middleware at the project root that calls `updateSession()` on every request to keep Supabase session cookies refreshed.

**Modified files:**
- `src/app/page.tsx` — Root `/` page now redirects: logged-in users → role-based path, unauthenticated → `/login`, problem (inactive/missing profile) → `/auth/logout`.
- `src/app/(public)/login/page.tsx` — Full login form (name + password) with error display wired to `logInWithName` server action.
- `src/app/(admin)/layout.tsx` — Protected with `requireAdminAppUser()`; passes `currentUser` to `TopBar`.
- `src/app/(member)/layout.tsx` — Protected with `requireCurrentAppUser()`; passes `currentUser` to `TopBar`.
- `src/components/TopBar.tsx` — Now accepts `currentUser` prop, displays the user's name, Logout is a real form POST to `/auth/logout`, Settings is a `<Link>` to `/admin/settings`.
- `src/app/layout.tsx` — Page title updated to "FleetTime", description updated.
- `package.json` — Added `@supabase/ssr` and `@supabase/supabase-js` dependencies.

**Bugs fixed:**
- `proxy.ts` (root) was incorrectly named — Next.js only recognises `middleware.ts`. Deleted `proxy.ts` and created `middleware.ts` exporting `middleware` so session refresh now actually runs on every request.
- Login page was hardcoding `redirect("/vehicles")` for an already-logged-in user; updated to use `getPostLoginPath(user.role)` for consistency with the rest of the app.

## Update
Timestamp: 2026-04-12 10:00:00 +0530

### Authentication Simplified & Fixed (Phase 2 Complete ✅)

Replaced the crypto-hash email generation approach with a clean admin API lookup.
The previous code converted names to fake internal emails using SHA256 — this was
confusing and broke when existing Supabase Auth users had real emails.

**New flow:** name → `public.users` lookup (case-insensitive) → user ID → Supabase Admin API → real auth email → `signInWithPassword`. Users only ever deal with name + password.

**New files:**
- `src/lib/supabase/admin.ts` — Supabase admin client using service role key (server-only).

**Updated files:**
- `src/lib/env.ts` — Added `getServiceRoleKey()` helper.
- `src/lib/auth/name-login.ts` — Replaced hash logic with `lookupEmailByName()`.
- `src/app/(public)/login/actions.ts` — Uses `lookupEmailByName` instead of `buildInternalAuthEmail`.
- `.env.local` — Added `SUPABASE_SERVICE_ROLE_KEY`.

**Result:** Login with name `Super Admin` + password `Admin@123` works correctly. ✅
