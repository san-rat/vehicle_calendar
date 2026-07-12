# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

FleetTime — a Next.js (App Router) vehicle scheduling app for teams/families, backed by Supabase (Postgres + Auth), styled with Tailwind CSS, deployed on Vercel.

## Commands

```bash
npm run dev          # start dev server
npm run build        # production build (also a useful end-to-end verification step)
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm test             # vitest run (single run)
npm run test:watch   # vitest watch mode
npm run test:coverage
```

Run a single test file: `npx vitest run src/lib/booking/bookings.test.ts`

Coverage is scoped (see `vitest.config.ts`) to pure helpers and server actions/components under `src/lib/{admin,booking,logs}`, `src/lib/auth/user.ts`, the various `actions.ts` files, and a handful of client components — not the whole tree. The threshold is 80% across branches/functions/lines/statements for those included files. When adding new logic in those areas, add matching `*.test.ts(x)` coverage in the same directory.

`server-only` is aliased to `src/test/server-only.ts` in `vitest.config.ts` so server-only modules can be unit tested under jsdom.

## Architecture

### Auth model: name + password, not email

Users log in with a display **name**, not an email. Supabase Auth still requires an email under the hood, so each `public.users` row maps 1:1 to an `auth.users` row (`public.users.id` is itself the `auth.users.id`), and login resolves name → internal auth email via `lookupEmailByName()` (`src/lib/auth/name-login.ts`) using the service-role admin client, then calls `signInWithPassword`. Emails are never shown in the UI. `public.users.name` is unique (case-insensitive) and is the user-facing identity.

A Postgres trigger (`handle_new_auth_user` in `supabase/migrations/0001_init_schema.sql`) auto-creates the matching `public.users` row whenever a new `auth.users` row is inserted.

Session state flows through three Supabase client variants in `src/lib/supabase/`:
- `server.ts` — cookie-based SSR client for Server Components/Actions (respects RLS as the logged-in user).
- `admin.ts` — service-role client for privileged server-side mutations (bypasses RLS); falls back to the anon key if no service role key is set.
- `client.ts` — browser client for client components.
- `proxy.ts` — `updateSession()`, called from root `middleware.ts` on every request to keep the session cookie fresh.

`src/lib/auth/user.ts` is the gate for all protected routes: `requireCurrentAppUser()` and `requireAdminAppUser()` redirect unauthenticated/unauthorized/inactive users (inactive or profile-missing accounts get redirected through `/auth/logout?reason=...` to force a clean sign-out). Route groups `(member)` and `(admin)` each call one of these in their `layout.tsx`.

### Role model

Two roles: `member` and `super_admin`. There's no per-vehicle ACL — any active member can book any active vehicle, subject to global `privilege_config` rules. Only `super_admin` reaches anything under `/admin`.

### Booking domain rules (see `src/lib/booking/`)

- Time is stored as `date + start_time + end_time` (not start/end timestamps), with `is_all_day` as a boolean shortcut (`00:00`–`23:59`) — see `bookings_time_window_check` in the migration.
- Slots are 30-minute increments; `dates.ts` / `bookings.ts` hold pure helpers for slot generation, date/month parsing, the Asia/Colombo business-time clock, conflict detection, and the booking-window check (`privilege_config.max_days_in_future`).
- Booking status lifecycle: `requested → confirmed | rejected`, plus `cancelled` and `overridden`. `confirmed` and `requested` are the only statuses surfaced on the calendar/day timeline; `rejected`/`cancelled`/`overridden` are excluded from availability views but remain in history/logs.
- `privilege_config` is a DB-enforced singleton (`privilege_config_singleton_idx`) controlling whether bookings auto-confirm (`allow_booking_freedom`) or always land as `requested` pending admin approval, plus optional per-booking duration limits and a reason requirement.
- Admin request approval (`src/app/(admin)/admin/requests/actions.ts`) supports normal approval, rejection, and **override** approval: overriding a request demotes conflicting `confirmed` bookings to `overridden` (one audit log per overridden booking) before confirming the request. This is done via sequential status-guarded updates, not a DB transaction/RPC — known limitation under concurrent admin actions.
- Members can only cancel a booking before its start time.

### Audit logging

Every mutating action (booking create/approve/reject/override, vehicle/member/privilege CRUD) writes to `log_entries` with a `before`/`after` JSON `snapshot`. Foreign keys (`actor_user_id`, `target_user_id`, `target_vehicle_id`, `booking_id`) are nullable so log rows survive hard deletes of the referenced row — snapshots are the durable record. Password resets log the event but never the password itself. Retention is 30 days, enforced by a manually-configured Supabase `pg_cron` job (not part of the app/migrations — see `document/work_done.md` for the exact SQL), and the `/log` page additionally filters to `created_at` within the last 30 days as a UI-level backstop.

### Hard delete, not soft delete

Members and vehicles are permanently deleted (no `deleted_at` columns). Admin delete actions require the operator to re-type the exact name as a confirmation, and are blocked server-side if the record has any associated bookings. Member deletion deletes the `auth.users` row via the admin client; the `public.users` row cascades via FK.

### Server actions pattern

Each mutating route has a co-located `actions.ts` (e.g. `src/app/(admin)/admin/vehicles/actions.ts`) and a matching `actions.test.ts`. The consistent shape: auth guard first (`requireAdminAppUser()`/`requireCurrentAppUser()`), *then* construct the service-role admin client, validate input with a pure helper from `src/lib/{admin,booking}/*.ts`, perform the mutation, write a `log_entries` row, `revalidatePath(...)` affected routes, and redirect back with a `?success=`/`?error=` status param. `src/components/ToastViewport.tsx` (mounted globally in `src/app/layout.tsx`) reads those query params and renders self-dismissing toasts, then strips them from the URL.

### UI system

`src/components/ui/index.tsx` is a local, dependency-free Tailwind primitive library (buttons, panels, fields, badges/status badges, notices, page headers, empty states, stat cards) — there is no external component library. `src/components/ui/ResponsiveOverlay.tsx` renders as a bottom sheet on mobile and a centered modal on desktop, used for admin "Manage" record overlays. Mobile and desktop share routes/data; layout differences are handled with Tailwind breakpoints rather than separate pages (see `document/UI/UI_Anti_Patterns.md` and `document/UX/UX_Anti_Patterns.md` for explicit anti-patterns to avoid, e.g. no heavy external libs, no desktop-only paradigms on mobile, no blocking confirmation modals).

### Timezone

All business-time logic (today/now checks, booking windows, log timestamps) is pinned to **Asia/Colombo**, not server-local time — see helpers in `src/lib/booking/dates.ts`.

## Reference docs

- `document/UI/UI_Guideline.md` / `UI_Anti_Patterns.md` — visual/component rules.
- `document/UX/UX_Guideline.md` / `UX_Anti_Patterns.md` — interaction rules (polling cadence, navigation, confirmation patterns).
- `document/work_done.md` — chronological build log; useful for "why was it built this way" context and the manual Supabase cron setup steps, but not for current file locations (those move; check the source).
