# MESQUITE ICS — Bathroom Monitor Tracker

A private, responsive PK–12 staff dashboard. Bathroom status is persisted by an atomic PostgreSQL function, broadcast through Supabase Realtime, and reconciled after every Realtime connection. It is **not** a request or approval system.

## Architecture

- Next.js 14 App Router, React, strict TypeScript, Tailwind CSS
- Supabase Auth, PostgreSQL, Row Level Security, and Realtime
- Vercel-compatible server rendering and browser Realtime client
- Atomic `set_student_bathroom_status` RPC serializes concurrent changes, maintains current status and visit history, and works with a partial unique index that permits only one open visit per student

## File structure

```text
app/                    authenticated monitor, login, and admin routes
components/             reusable dashboard, student, status, and roster UI
lib/                    Supabase browser/server clients, types, time helpers
supabase/migrations/    schema, indexes, RPC, RLS, Realtime publication
supabase/import/        minimal privacy-safe CSV template
scripts/                Excel-to-CSV roster normalization
 tests/                  unit tests
```

## Supabase setup

1. Create a Supabase project and run `supabase/migrations/001_initial_schema.sql` in the SQL editor (or with the Supabase CLI).
2. Copy `.env.example` to `.env.local` and fill in the project URL and anon/publishable key. Never expose the service-role key to the browser.
3. In **Authentication**, create staff users. Add an authorization row after each user is created:
   ```sql
   insert into public.profiles (id, role) values ('AUTH_USER_UUID', 'STAFF');
   -- Use ADMIN only for personnel who require history and roster access.
   ```
4. Confirm Realtime replication includes `student_status`; the migration adds it to `supabase_realtime`.
5. Configure the production Site URL and redirect URLs in Supabase Auth. Deploy to Vercel and add the two public Supabase environment variables.

Users without a `profiles` row cannot read student data. Staff can read roster/status and invoke the transition RPC. Only admins can read history or mutate the roster; RLS enforces these rules independently of the UI. Direct client writes to status/history have no policy.

## Roster import

The accepted format is `first_name,last_name,grade,section`; see `supabase/import/roster-template.csv`. It deliberately excludes contacts and program indicators.

Convert the supplied workbook:

```bash
npx tsx scripts/import-roster.ts /path/to/roster.xlsx > roster.csv
```

The converter recognizes PreK, Kinder, 1ST, 2A, 3A/3B, 4TH, 5A/5B, 6A/6B, 7A, 8A/8B, and 9TH–12TH, normalizes grade values, and preserves the sheet/class as the section. Review the privacy-minimized CSV, then import it into `students` using the Supabase table editor. Inserts automatically create default `IN` status rows.

## Local development and verification

```bash
npm install
npm run dev
npm test
npm run typecheck
npm run lint
npm run build
```

For a two-device Realtime check, sign in in two browsers, mark a student OUT in one, and verify the other updates without refresh. Mark the student IN from the second browser and confirm the first updates. In SQL, confirm the visit was closed with duration and actor IDs. Temporarily disconnect/reconnect one browser and verify its Live indicator reconnects and the roster reconciles.

## Operational notes

- OUT statuses never reset automatically. Admins see a stale warning when `out_since` is from another calendar day.
- 10-minute and 15-minute warnings are informational and do not alter status.
- Failed RPC writes display an error and refetch authoritative state; the interface does not claim a failed transition succeeded.
- Visit rows are protected from student deletion (`ON DELETE RESTRICT`); roster management deactivates students instead.
