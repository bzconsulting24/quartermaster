# Repository Guidelines

Quartermaster pairs a Vite/React client with an Express + Prisma API. Follow these notes to keep contributions predictable.

## Project Structure & Module Organization
`src/` contains the SPA (components, pages, shared types). `server/` is organized by feature: `routes/` expose Express routers, `services/` and `utils/` encapsulate logic, while `jobs/` + `workers/` back BullMQ automation. The Prisma schema, migrations, and seeding script live in `prisma/`. Build output (`dist/`, `dist-server/`) is transient—never commit it.

## Build, Test, and Development Commands
- `npm run dev` — hot-reload the client on `localhost:5173`.
- `npm run server:dev` — Nodemon + tsx pipeline for the API on port 4000.
- `npm run dev:docker` — runs both dev targets with matching container flags.
- `npm run prisma:migrate`, `npm run prisma:generate`, `npm run db:seed` — keep Prisma state synchronized.
- `npm run build` and `npm run build:server` — bundle React and compile the server before `npm start`.
- `npm run worker:automation` — execute queue workers in `server/workers`.
- `npm run lint` — type-check both tsconfig targets; treat failures as blockers.

## Coding Style & Naming Conventions
Use TypeScript, ES modules, and the existing two-space indentation. React components/hook files use `PascalCase` + `useThing`, props and helpers prefer `camelCase`, and server modules export explicit functions instead of default objects. Keep side-effects (fetching, Prisma access) inside `server/services` and presentational logic inside component folders. Run `npm run lint` before committing so both client and server configs stay type-safe.

## Testing Guidelines
We do not yet ship an automated `npm test`. Until that lands, document manual checks: run `npm run dev` and `npm run server:dev`, hit `/api/health`, and walk through the UI scenario being changed. If you add automated coverage, align with the stack—Vitest + React Testing Library for client code, Supertest-driven specs for Express handlers—naming files `<feature>.spec.ts(x)` beside the implementation. Target ≥80% coverage for new surface area and call out any gaps in the PR description.

## Commit & Pull Request Guidelines
Git history shows Conventional Commits (`fix:`, `fix(backend): ...`). Keep messages short with `type(optional-scope): imperative summary`, and include breaking/migration notes in the body when relevant. Pull requests should provide a summary, linked issue, screenshots/GIFs for UI tweaks, schema or env updates (e.g., `DATABASE_URL` changes), and the manual or automated test evidence. Verify `npm run lint` and required build steps locally before requesting review.
