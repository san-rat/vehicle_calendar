# CODEX_TASKS.md — FleetTime Security, Data-Integrity & UI/UX Hardening (PRODUCTION run)

> **You are Codex.** This document is your complete, self-contained brief. You have **no memory of the prior audit** — everything you need is here. Read the whole document **once, top to bottom, before touching anything.** Sections 2 (Production Safety) and 13 (Completion Protocol) are the two things you must not get wrong.

---

## 0. TL;DR (the 9 things that matter most)

1. ⚠️ **You are operating against the LIVE PRODUCTION database** (`.env.local` points at project `qjwzkwvprgzuitdoqdlm`). Real users, real data. There is **no dev database** for this run. Read Section 2 before anything.
2. **Two absolute rules:** (a) **Never** create/update/delete **real** rows — only `FT_TMP_`-prefixed test data that you create and then delete in the same step. (b) **Do NOT apply** the two schema migrations (`0003` RLS, `0004` overlap constraint) to the database — you **author** them + rollback scripts; **the supervisor (Claude) applies them** under human supervision. See Section 12.
3. Work happens on a **new branch** `codex/security-ux-hardening`, in **~10–11 commits** (Section 9).
4. Root cause of most issues: a prior "security + booking fix" effort was **reverted** — the repo is in the **pre-fix vulnerable state**. Notably, enabling **RLS on this prod DB already broke login once** (the reverted `Fix login lookup under RLS` / `Fix production login with RLS` commits). That is exactly why application of the RLS migration is left to the supervised step.
5. After **every** commit, run the verification gate (Section 6): `typecheck → test → lint → build`. All must pass.
6. For app-behavior testing that needs the DB, use **`FT_TMP_`-prefixed** records via the service-role client and **delete them in the same step**. Never touch real records.
7. Take **screenshots** as evidence (Section 11) into `screenshots/` with the exact names. Two of them (`02`, `17`) are captured by the **supervisor** after the migrations are applied — you skip those.
8. Write a final report `CODEX_WORK_REPORT.md` (Section 10) embedding each screenshot by name, and clearly stating that `0003`/`0004` are **authored but NOT applied**.
9. **DO NOT push. DO NOT open a PR.** When 100% finished, create the untracked sentinel **`CODEX_COMPLETE.txt`** (Section 13). A supervising agent is watching for it and will verify, apply the migrations, push, and open the PR. Re-read Section 13 before you finish.

---

## 1. What FleetTime is (orientation)

FleetTime is a **Next.js 16 (App Router) + React 19 + Tailwind v4** vehicle-scheduling app for a team/family, backed by **Supabase (Postgres + Auth)**, on Vercel. Read `CLAUDE.md` first — it's an accurate architecture guide. Key points:

- **Auth is name + password, not email.** Users log in with a display **name**; login resolves name → internal auth email via the RPC `lookup_auth_email_by_name`, then calls `signInWithPassword`. `public.users.id` **is** the `auth.users.id` (1:1). A trigger `handle_new_auth_user` auto-creates the `public.users` row.
- **Two roles:** `member`, `super_admin`. Only `super_admin` reaches `/admin/*`. Guards: `src/lib/auth/user.ts` (`requireCurrentAppUser`, `requireAdminAppUser`), called from the route-group `layout.tsx` files.
- **Three Supabase clients** (`src/lib/supabase/`): `server.ts` (cookie SSR client, runs as the logged-in user / anon), `admin.ts` (service-role, bypasses RLS — used for nearly all reads & writes), `client.ts` (browser client — **confirmed unused**).
- **Booking model:** `bookings` stores `date + start_time + end_time` (+ `is_all_day`). 30-min slots. Statuses `requested → confirmed | rejected`, plus `cancelled`, `overridden`. Only `confirmed` + `requested` show on calendar/day views. `privilege_config` is a singleton (auto-confirm vs approval, time limit, future window, reason requirement).
- **Audit log:** every mutation writes a `log_entries` row with `before`/`after` JSON. FKs nullable so logs survive hard deletes.
- **Timezone:** all business-time logic is Asia/Colombo (`src/lib/booking/dates.ts`).
- **UI:** local Tailwind primitives in `src/components/ui/index.tsx`. No external component lib. Tokens in `src/app/globals.css` — **use the tokens** (Section 8).

---

## 2. ⚠️ PRODUCTION SAFETY (read twice)

You are working against the **live** database. Treat every query as if a real user is mid-session.

**Division of labor — who does what:**

| Task | Codex (you) | Supervisor (Claude) |
|---|---|---|
| App code fixes (cancellation, auth hardening, error boundaries, UX, design system) | ✅ author + verify | review |
| Migration **files** `0003_enable_rls.sql`, `0004_overlap_constraint.sql` + their `*_rollback.sql` | ✅ author | review |
| **Applying** `0003`/`0004` to the prod DB | ❌ never | ✅ applies with backup + smoke + rollback |
| RLS "after" proof + double-book "after" proof (screenshots `02`, `17`) | ❌ skip | ✅ captures at apply time |
| Push branch / open PR | ❌ never | ✅ after full verification |

**You MUST:**
- Author both migrations **and** a matching rollback (`0003_enable_rls_rollback.sql`, `0004_overlap_constraint_rollback.sql`) that cleanly undoes them. Do **not** run them against the DB.
- For any test that needs data, create records **prefixed `FT_TMP_`** (e.g. vehicle name `FT_TMP_Test Van`, member name `FT_TMP_Admin`) via the service-role client, and **delete them in the same verification step**. This is the project's established testing pattern.
- Leave `.env.local` exactly as-is (it already points at prod and the service-role key is present). Keep it gitignored.
- Work only on branch `codex/security-ux-hardening`.

**You MUST NOT:**
- ❌ Apply `0003`/`0004` (or any DDL) to the database. ❌ Run `0001_init_schema.sql` (objects already exist on prod).
- ❌ Create, update, or delete any **real** user, vehicle, booking, privilege row, or log entry.
- ❌ Reset or change the password of any real account.
- ❌ Push, open a PR, force-push, or rewrite history.
- ❌ Commit `.env.local` or any secret.
- ❌ `@ts-ignore` / `eslint-disable` / `.skip` to make a check pass — fix the cause.

If something is impossible (e.g. you can't reach the DB to create `FT_TMP_` data), **stop, write `CODEX_BLOCKED.txt` at the root describing the blocker and what you completed, then also create `CODEX_COMPLETE.txt` with `STATUS: BLOCKED`** so the supervisor is notified rather than waiting.

---

## 3. Toolchain & how to run everything

```bash
npm install            # Node 20+
npm run dev            # dev server -> http://localhost:3000  (talks to PROD data — read-only browsing only)
npm run build          # production build (real end-to-end check)
npm start              # serve the build
npm run lint           # eslint
npm run typecheck      # tsc --noEmit
npm test               # vitest run
npx vitest run path/to/file.test.ts
```
- Tests run under jsdom; `server-only` is aliased in `vitest.config.ts`.
- Coverage is **scoped** with an 80% threshold (see `vitest.config.ts`). Add tests in the same dir when you add logic under `src/lib/{admin,booking,logs}`, `src/lib/auth/user.ts`, the `actions.ts` files, or covered components.
- If `npm run lint` hangs >90s (known Windows-mount issue), note it and rely on `typecheck` + `build` (build also runs ESLint). A hang is **not** a pass — say so.

---

## 4. Environment & test identity (prod context)

`.env.local` is already correct (prod URL + anon key + **service-role key present**). Do **not** change it. Do **not** re-run the bootstrap migrations/seed — prod is already set up.

### 4.1 Temporary admin for authenticated screenshots
Prod accounts must not be touched, so create a **throwaway `FT_TMP_` super_admin** via the service-role API, use it for screenshots, then **delete it** (account + auth user) at the end. Write a non-committed helper `scripts/tmp-admin.mjs` (delete or gitignore it; never commit):

```js
// node scripts/tmp-admin.mjs create   |   node scripts/tmp-admin.mjs delete
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(url, svc, { auth: { persistSession: false } });
const NAME = "FT_TMP_Admin";
const PASS = "FtTmp!" + crypto.randomBytes(6).toString("hex"); // strong, ephemeral

if (process.argv[2] === "create") {
  const email = `ft-tmp-admin--${Date.now()}@auth.fleettime.local`;
  const { data, error } = await admin.auth.admin.createUser({
    email, password: PASS, email_confirm: true, user_metadata: { name: NAME },
  });
  if (error) throw error;
  await admin.from("users").update({ name: NAME, role: "super_admin" }).eq("id", data.user.id);
  console.log("LOGIN NAME:", NAME, "\nLOGIN PASSWORD:", PASS, "\nID:", data.user.id);
} else if (process.argv[2] === "delete") {
  const { data } = await admin.from("users").select("id").eq("name", NAME).maybeSingle();
  if (data?.id) { await admin.auth.admin.deleteUser(data.id); console.log("deleted", data.id); }
  else console.log("nothing to delete");
}
```
Print the generated password to your console only; never write it to a committed file. Log in at `/login` with the **name** `FT_TMP_Admin`. **Run `delete` before you finish.** (Prefer `FT_TMP_` data in screenshots where practical to avoid real PII; real admin pages will still show some real records — that's acceptable, it's the operator's own data.)

### 4.2 App flow to test
`/login` (name+password) → `/vehicles` → click vehicle → `/vehicles/{id}/calendar` → click a bookable day → `/vehicles/{id}/date/{YYYY-MM-DD}` (timeline + form). Admin: `/admin/settings` → requests/vehicles/members/privileges. `/log` for the audit log. Logout = POST `/auth/logout`.

---

## 5. The audit findings you are fixing

Severities: 🔴 critical, 🟠 high/medium, 🟣 UI/UX.

| # | Sev | Issue | Where |
|---|----|-------|-------|
| 1 | 🔴 | **RLS disabled on all tables** — anon key reads/writes everything | migration `0003` (author only) |
| 2 | 🔴 | **Admin client falls back to anon key** if service role missing | `src/lib/supabase/admin.ts` |
| 3 | 🔴 | **Double-booking race (TOCTOU)** — JS-only conflict check | migration `0004` + `date/[date]/actions.ts`, `requests/actions.ts` |
| 4 | 🔴 | **Booking cancellation does not exist** | missing feature |
| 5 | 🟠 | **No `error.tsx` / `not-found.tsx` / `loading.tsx`** | `src/app/**` |
| 6 | 🟠 | **Audit-log failure reported as error after the row already committed** | all `actions.ts` |
| 7 | 🟠 | **`GET /auth/logout` is CSRF-able** | `src/app/auth/logout/route.ts` |
| 8 | 🟠 | **Login RPC enumeration + email leak**; hardcoded legacy map; no rate limit | `src/lib/auth/name-login.ts`, `0002…rpc.sql` |
| 9 | 🟠 | **Weak password policy** (min 8, no max → bcrypt 72-byte truncation) | `src/lib/admin/members.ts` |
| 10 | 🟣 | No submit/pending state on forms except login | many |
| 11 | 🟣 | Booking-day view renders bookings twice | `BookingWorkspace.tsx` |
| 12 | 🟣 | Past time slots selectable for "today" | `BookingWorkspace.tsx` |
| 13 | 🟣 | `StatusBadge` uses raw Tailwind palette, not tokens | `ui/index.tsx` |
| 14 | 🟣 | Custom buttons/day cells lack focus rings | `globals.css`, `BookingWorkspace`, `CalendarWorkspace` |
| 15 | 🟣 | Mobile drawer: no Esc, no focus trap | `TopBar.tsx` |
| 16 | 🟣 | Low contrast on 11px muted labels | various |
| 17 | 🟣 | Dead code (`StatCard`, `skeleton-block`); reintroduced "Secure sign in" badge | `ui/index.tsx`, `globals.css`, `login/page.tsx` |
| 18 | 🟣 | Loading skeletons never wired up | `src/app/**` |

---

## 6. The verification gate (after EVERY commit)

```bash
npm run typecheck   # exit 0
npm test            # all green
npm run lint        # exit 0 (note if it stalls; build re-checks)
npm run build       # compile, 0 errors
```
For commits touching app data behavior, also do the `FT_TMP_` smoke (Section 7). Fix any failure in the same commit before moving on.

---

## 7. Verification recipes (prod-safe)

### 7.1 RLS "before" proof (Commit 2) — you capture the BEFORE only
RLS is **not** applied by you, so you can only demonstrate the **current vulnerability**, which justifies the fix. Run (read-only):
```bash
DEV=skip; URL="$NEXT_PUBLIC_SUPABASE_URL"; ANON="$NEXT_PUBLIC_SUPABASE_ANON_KEY"
curl -s "$URL/rest/v1/users?select=id,name,role&limit=3"    -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
curl -s "$URL/rest/v1/bookings?select=id,status&limit=3"    -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
```
These currently return rows (the hole). Save this output as `screenshots/02b-rls-anon-exposed-before.png` (or `.txt`). The **"after" proof** (anon returns `[]`) is captured by the supervisor once the migration is applied → `02-rls-anon-blocked.png`.

### 7.2 App smoke (after any app-code change)
```bash
npm run build && (npm start &) ; sleep 6
curl -s -o /dev/null -w "/login %{http_code}\n"   http://127.0.0.1:3000/login     # 200
curl -s -o /dev/null -w "/vehicles %{http_code}\n" http://127.0.0.1:3000/vehicles # 307 -> /login
# then log in as FT_TMP_Admin in the browser and click every page; no 500s.
```
Stop the server afterward. **Reads against prod are fine; any writes during testing must be `FT_TMP_` and cleaned up.**

### 7.3 Cancellation / booking tests (Commit 5, etc.)
Create an `FT_TMP_` vehicle + an `FT_TMP_` booking (service role), exercise the flow (cancel, approve, override), assert the result, then **delete the `FT_TMP_` rows + any log rows you created**. Never use real bookings.

### 7.4 Overlap-constraint pre-check (Commit 4) — produce this for the supervisor
The supervisor must know whether applying `0004` will fail on existing data. Provide a query in your report:
```sql
-- counts overlapping CONFIRMED pairs that would violate the new constraint
select count(*) from public.bookings a
join public.bookings b
  on a.vehicle_id = b.vehicle_id and a.id < b.id and a.status='confirmed' and b.status='confirmed'
 and tsrange((a.date+a.start_time),(a.date+a.end_time)) && tsrange((b.date+b.start_time),(b.date+b.end_time));
```
Run it **read-only** and report the number. **Do not delete or modify** any real bookings to "make room" — if the count is > 0, flag it for the supervisor to resolve with the operator.

---

## 8. Design system — tokens you MUST use

From `src/app/globals.css`. Use the CSS variables; never add raw hex that duplicates a token.
- Brand: `--brand-500 #117a6c`, `--brand-600 #0d6459`, `--brand-100 #d9f2ec`
- Semantic: `--success #198754`/`--success-soft`; `--danger #c73b37`/`--danger-soft`; `--warning #b4742e`/`--warning-soft`; `--info #2a6faa`/`--info-soft`
- Text: `--text-primary #10212b`, `--text-secondary #485c67`, `--text-muted #70818b`
- Surfaces: `--bg-app #f3f5f7`, `--bg-surface #fff`, `--bg-surface-tint #f6fbfa`, `--bg-surface-inset #edf2f1`
- Borders: `--border-subtle #d8e1e7`, `--border-strong #bcc9d1`
- Fonts: headings/buttons = Plus Jakarta Sans (`--font-heading`), body = Inter (`--font-body`); radii 14–24px.
- User palette: `#3B82F6 #10B981 #6366F1 #F97316 #EC4899 #14B8A6`.

`StatusBadge` mapping (Commit 10): confirmed→success, requested→info, rejected→danger, overridden→warning, cancelled→neutral.

---

## 9. THE WORK — commit by commit

> Each commit: change → tests → gate (Section 6) → screenshot(s) → commit. Two of the commits (2, 4) **author migrations without applying them**.

### Commit 1 — `chore: baseline existing test suite and tooling`
The working tree already has correct uncommitted work (new `*.test.ts(x)`, `vitest.config.ts`, `CLAUDE.md`, `package.json`/lockfile, and this doc). Verify and baseline.
```bash
# from main, confirm green:
npm run typecheck && npm test && npm run build
git checkout -b codex/security-ux-hardening
git add -A
git commit -m "chore: baseline existing test suite and tooling"
```
If not green, fix the minimal cause first and note it.

### Commit 2 — `feat(db): RLS enable + policies migration (authored, not applied)` 🔴 #1
**Author only.** Create `supabase/migrations/0003_enable_rls.sql` and `supabase/migrations/0003_enable_rls_rollback.sql`. **Do not run them.** Design (safe because the browser client is unused and all app reads use the service-role client except the authenticated own-row read):

`0003_enable_rls.sql`:
```sql
alter table public.users            enable row level security;
alter table public.vehicles         enable row level security;
alter table public.privilege_config enable row level security;
alter table public.bookings         enable row level security;
alter table public.log_entries      enable row level security;

-- authenticated users may read ONLY their own row (login + getCurrentAppUserState).
drop policy if exists users_select_self on public.users;
create policy users_select_self on public.users
  for select to authenticated using (auth.uid() = id);

-- vehicles, privilege_config, bookings, log_entries: NO policies.
-- RLS on + no policy = deny all to anon/authenticated; the service-role client bypasses RLS.
```
`0003_enable_rls_rollback.sql`:
```sql
drop policy if exists users_select_self on public.users;
alter table public.users            disable row level security;
alter table public.vehicles         disable row level security;
alter table public.privilege_config disable row level security;
alter table public.bookings         disable row level security;
alter table public.log_entries      disable row level security;
```
In your report, include the **exact apply/verify/rollback runbook** the supervisor will follow (apply `0003` → run RLS proof → log in as `FT_TMP_Admin` and click every page → if login or any page breaks, run the rollback immediately). Capture `02b-rls-anon-exposed-before.png` (Section 7.1).

### Commit 3 — `fix(security): require service-role key; stop anon fallback` 🔴 #2
`src/lib/supabase/admin.ts`: change `createSupabaseAdminClient()` to use `getServiceRoleKey()` (throwing variant) instead of `getOptionalServiceRoleKey() ?? anonKey`. Remove `getOptionalServiceRoleKey` if now unused (grep first). This is app code — safe to ship; prod has the key. Verify the app still smokes (Section 7.2).

### Commit 4 — `feat(db): overlap-constraint migration (authored, not applied) + error mapping` 🔴 #3
**Author the migration; ship the code.** Create `supabase/migrations/0004_overlap_constraint.sql` + `0004_overlap_constraint_rollback.sql`:
```sql
-- 0004_overlap_constraint.sql
create extension if not exists btree_gist;
alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (
    vehicle_id with =,
    tsrange((date + start_time), (date + end_time)) with &&
  ) where (status = 'confirmed');
```
```sql
-- 0004_overlap_constraint_rollback.sql
alter table public.bookings drop constraint if exists bookings_no_overlap;
```
Ship the **app-code** part now (safe): in `createBooking` (`date/[date]/actions.ts`) and `approveBookingRequest` (`requests/actions.ts`), map Postgres error code **`23P01`** (exclusion_violation) to the friendly message `"This vehicle already has a confirmed booking during that time."`. Keep the existing JS pre-check; keep the override ordering (demote conflicts to `overridden` **before** confirming). Extract the error-mapping into a tiny pure helper and unit-test it. Run the overlap **pre-check** query (Section 7.4) read-only and report the count for the supervisor. The live "double-book blocked" proof (`17`) is captured by the supervisor after applying `0004`.

### Commit 5 — `feat(booking): member booking cancellation` 🔴 #4
New `cancelBooking` action in `date/[date]/actions.ts`: guard `requireCurrentAppUser()`; load booking via service role; authorize (`booking.user_id === currentUser.id` **or** `role === 'super_admin'`); block if not `confirmed`/`requested` or already started (reuse Asia/Colombo helpers like `getApprovalTimingProblem`); status-guarded update to `cancelled` with `updated_by`; write `booking_cancelled` log with `before`/`after`; `revalidatePath` day + calendar; redirect with toast. UI: a `tone="danger"` Cancel button on owned/admin-visible bookings in the day view (`TimelineDetailCard`), shown only when allowed; thread `currentUserId`/`role` + bound action from the page. Add authorization/timing unit tests. Verify with `FT_TMP_` booking; screenshot `07-booking-cancelled.png`.

### Commit 6 — `fix(auth): harden login + logout` 🟠 #7 #8 #9
- Logout: remove the `GET` handler in `auth/logout/route.ts` (POST only).
- `name-login.ts`: remove the hardcoded `legacyLoginEmails` map and the anonymous `from("users").ilike("name")` + `getUserById` email-returning fallback; rely solely on the `lookup_auth_email_by_name` RPC. (Also fixes the only anon table read that RLS would block.) Keep the `lookupEmailByName` contract; update `login/actions.test.ts`.
- `members.ts` `validateMemberPassword`: add a 72-byte max; keep min 8; update tests.
- Add `// TODO(security): add login rate limiting` near the login action; mention in report.
- Verify login still works as `FT_TMP_Admin`; `GET /auth/logout` no longer logs out, POST does. Screenshot `01-login.png`.

### Commit 7 — `feat(ux): error, not-found, loading boundaries with skeletons` 🟠 #5 🟣 #18
Add `src/app/global-error.tsx`, route-group `error.tsx` (member + admin) using `EmptyState` + `Notice tone="danger"` + a **Try again** (`reset()`) button; `src/app/not-found.tsx` (branded 404 → `/vehicles`); `loading.tsx` for the data-heavy segments using the existing **`skeleton-block`** class inside `Panel`s. Verify by temporarily pointing a page at a bad table in a **local-only** edit (revert before commit) and hitting a bad URL. Screenshots `14-error-boundary.png`, `15-not-found.png`, `16-loading-skeleton.png`.

### Commit 8 — `fix(ux): non-blocking audit-log + pending submit state` 🟠 #6 🟣 #10
- #6: in every `actions.ts`, a successful mutation must not be reported as an error if only the log insert failed — log server-side and still redirect success (or a soft warning), consistently.
- #10: shared `SubmitButton` using `useFormStatus()` + the existing `Button` `loading` prop; use it on booking, approve/reject/override, vehicle/member/privilege forms. Add a test. Screenshot `06-booking-created-toast.png`.

### Commit 9 — `fix(ux): booking-day timeline (past slots, de-dup)` 🟣 #11 #12
Disable past `<option>`s for "today" (pass business-time minutes from the page); de-duplicate the timeline vs the detail list (prefer click-to-expand blocks that also host the Cancel button). Update the `BookingWorkspace` test. Screenshots `04-calendar.png`, `05-booking-day.png`.

### Commit 10 — `style(ui): design-system consistency, a11y, dead-code` 🟣 #13 #14 #16 #17
Reskin `StatusBadge` to the semantic tokens (Section 8); add `focus-visible` rings to custom buttons/day cells/tab toggles/password eye/filter chips; bump 11px muted labels on tinted surfaces to `--text-secondary`; remove dead `StatCard`, remove the reintroduced "Secure sign in" badge and tighten the login hero. Screenshots `13-log.png`, `08-admin-requests.png`, `09-admin-requests-override.png`, `12-admin-privileges.png`.

### Commit 11 — `fix(ux): mobile drawer a11y + dashboard redundancy` 🟣 #15
`TopBar` drawer: Esc-to-close, focus trap, return focus on close, backdrop on click/pointer. Remove the mobile admin quick-actions duplication on `vehicles/page.tsx` (keep the drawer). Screenshots `18-mobile-nav.png`, `10-admin-vehicles.png`, `11-admin-members.png`.

### Commit 12 (final) — `docs: codex work report + evidence`
Ensure all screenshots exist (minus `02`/`17`, which are supervisor-captured), write `CODEX_WORK_REPORT.md` (Section 10), `node scripts/tmp-admin.mjs delete` to remove the temp admin, then do the Completion Protocol (Section 13).

> 10–12 commits total. You may merge 10+11 if you prefer. Don't pad or split arbitrarily.

---

## 10. `CODEX_WORK_REPORT.md` (write this)

Root file. Must include:
- **Summary:** branch, commit list (hash + subject), gate results, confirmation prod data was untouched (only `FT_TMP_`).
- **Findings #1–#18:** what each was, what you changed (files), how verified, embedded screenshot(s) by filename, e.g. `![Cancellation](screenshots/07-booking-cancelled.png)`.
- **⚠️ Migrations authored but NOT applied:** state clearly that `0003`/`0004` (+ rollbacks) are committed but **not run**. Include the **apply/verify/rollback runbook** for the supervisor and the **overlap pre-check count** (Section 7.4).
- **Screenshot index:** filename → what it shows → commit. Note `02` and `17` are pending supervisor capture.
- **Known limitations / follow-ups:** login rate limiting (TODO); prod still needs `0003`/`0004` applied + `SUPABASE_SERVICE_ROLE_KEY` set in Vercel before next deploy.

---

## 11. Screenshots — `screenshots/` (commit the PNGs)

Method is your choice (Playwright headless recommended; or terminal capture for proofs). Required files:

| File | Shows | Captured by |
|---|---|---|
| `01-login.png` | Login (cleaned hero) | you |
| `02-rls-anon-blocked.png` | anon read returns `[]` after RLS | **supervisor** |
| `02b-rls-anon-exposed-before.png` | anon read returns rows now (the hole) | you |
| `03-vehicles-dashboard.png` | vehicles dashboard | you |
| `04-calendar.png` | month calendar | you |
| `05-booking-day.png` | day workspace | you |
| `06-booking-created-toast.png` | success toast | you |
| `07-booking-cancelled.png` | cancellation works | you |
| `08-admin-requests.png` | requests list | you |
| `09-admin-requests-override.png` | override flow | you |
| `10-admin-vehicles.png` | vehicle manager + overlay | you |
| `11-admin-members.png` | member manager | you |
| `12-admin-privileges.png` | privileges | you |
| `13-log.png` | log w/ semantic badges | you |
| `14-error-boundary.png` | error boundary | you |
| `15-not-found.png` | 404 | you |
| `16-loading-skeleton.png` | loading skeleton | you |
| `17-double-book-blocked.png` | overlap rejected by constraint | **supervisor** |
| `18-mobile-nav.png` | mobile drawer (~390px) | you |

Prefer `FT_TMP_` data in shots where practical. If a shot is impossible, leave a same-named `.txt` note and explain in the report.

---

## 12. (reserved)

*(Migration application is covered in Sections 2 and 9. The supervisor applies `0003` then `0004` to prod after reviewing your branch, with a `pg_dump` backup taken first, the RLS/double-book proofs captured, and your rollback scripts ready.)*

---

## 13. ⛔ COMPLETION PROTOCOL — DO NOT MISS THIS ⛔

1. Finish **all** commits (Section 9), including the report + screenshots, and **delete the temp admin** (`node scripts/tmp-admin.mjs delete`) + any `FT_TMP_` data.
2. Run the **full gate** one last time (Section 6); confirm green.
3. **Do NOT push. Do NOT open a PR. Do NOT apply any migration.** Leave everything committed on local branch `codex/security-ux-hardening`.
4. As your **very last action**, create an **untracked** file at the repo root named exactly **`CODEX_COMPLETE.txt`** (do not commit it; add to `.gitignore` if needed):
   ```
   STATUS: COMPLETE
   BRANCH: codex/security-ux-hardening
   COMMITS: <n> (last hash: <hash>)
   GATE: typecheck=pass tests=pass(<count>) lint=pass|stalled build=pass
   MIGRATIONS: 0003,0004 authored + rollbacks committed, NOT applied
   OVERLAP_PRECHECK_COUNT: <number from 7.4>
   FT_TMP_CLEANUP: done (temp admin + test data deleted)
   REPORT: CODEX_WORK_REPORT.md
   SCREENSHOTS: <count> in screenshots/ (02,17 pending supervisor)
   TIMESTAMP: <iso8601>
   ```
5. The supervisor is polling for `CODEX_COMPLETE.txt`. When it appears, it stops watching, reviews your work, applies `0003`/`0004` to prod under human supervision (backup + smoke + rollback), captures `02`/`17`, then pushes and opens the PR against `main`.

> Hard blocker? Create `CODEX_BLOCKED.txt` (what blocked you + what you finished) **and** `CODEX_COMPLETE.txt` with `STATUS: BLOCKED` so the supervisor is notified.

---

## 14. Quick reference

```
Branch:        codex/security-ux-hardening   (never push, never PR)
DB:            LIVE PROD (qjwzkwvprgzuitdoqdlm) — FT_TMP_ data only, clean it up
Migrations:    author 0003/0004 + rollbacks; DO NOT apply (supervisor applies)
Temp login:    FT_TMP_Admin via scripts/tmp-admin.mjs (delete before finishing)
Gate:          npm run typecheck && npm test && npm run lint && npm run build
Done signal:   create untracked CODEX_COMPLETE.txt at repo root — Section 13
Report:        CODEX_WORK_REPORT.md (embed every screenshot by name)
```

Be meticulous, never mutate real data, never apply the migrations, and **don't forget the sentinel file.**
