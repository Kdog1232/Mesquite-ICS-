# MESQUITE ICS — Bathroom Monitor Tracker

A frontend-only, responsive PK–12 student status dashboard built with Next.js,
React, TypeScript, and Tailwind CSS.

## Architecture

- The privacy-minimized roster is bundled in `data/students.ts`.
- React state drives the interface.
- `localStorage` remembers only each student ID, IN/OUT status, and OUT timestamp.
- Each browser has independent state. There is no synchronization, database,
  authentication, API, or other backend service.
- Next.js produces a static export suitable for Vercel frontend hosting.

## Development

```bash
npm install
npm test
npm run typecheck
npm run lint
npm run build
```

To update the roster, edit `data/students.ts` during development. Do not add
private student fields or parse spreadsheets in the deployed application.
