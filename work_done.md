# Work Done

Date: 2026-02-03

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
