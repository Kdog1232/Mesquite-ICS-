# MESQUITE ICS — Hallway Monitor Tracker

A responsive PK–12 live student status dashboard built with Next.js, React,
TypeScript, Tailwind CSS, and Supabase.

## Architecture

- The privacy-minimized roster is bundled in `data/students.ts`.
- React state renders status loaded from Supabase; it is not authoritative.
- Supabase Auth and Row Level Security protect the live tracker and daily log.
- `student_status` Realtime events synchronize connected staff browsers.
- The existing `set_student_hallway_status` RPC owns status and history writes.
- Next.js produces a static export suitable for Vercel frontend hosting.

Copy `.env.example` to `.env.local` and provide the project's public Supabase
URL and publishable/anon key. Never use a service-role or secret key here.

## Development

```bash
npm install
npm run typecheck
npm run lint
npm run build
```

To update the roster, edit `data/students.ts` during development. Do not add
private student fields or parse spreadsheets in the deployed application.
