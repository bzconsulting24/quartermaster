# Quartermaster

## Local development

1. Clone the repo into a directory without spaces in the path (for example `~/workspace/quartermaster`). `npm install` tends to fail on macOS when the path includes spaces such as `/Volumes/JPU-WORKSTATION 2TB/...`, so relocate the project before installing dependencies.
2. Copy `.env.example` to `.env` and update `DATABASE_URL` plus `REDIS_URL` for your PostgreSQL and Redis instances.
3. Install dependencies and generate the Prisma client:
   ```bash
   npm install
   npm run prisma:generate
   ```
3. Start both Vite and the Express API locally (API + worker):
   ```bash
   npm run server:dev    # Express API on port 4000
   npm run worker:automation   # Automation worker consuming BullMQ jobs
   npm run dev          # In a separate terminal, start Vite dev server
   ```

## Docker workflows

### Development container

Use the dev-specific configuration for hot reload inside Docker:

```bash
docker compose -f docker-compose.dev.yml up --build
```

This exposes Vite on port `5173` and the API on port `4000`. Source files are bind-mounted so changes on the host trigger reloads inside the container.

### Production image

The default `Dockerfile` builds the React app, compiled server, and Prisma client:

```bash
docker build -t quartermaster:latest .
docker run --env-file .env -p 4000:4000 quartermaster:latest
```

## Auto-rebuild on commit

A ready-made `post-commit` hook rebuilds the dev image on every commit. Enable it once per clone:

```bash
git config core.hooksPath .githooks
```

After enabling, each `git commit` runs:

```bash
docker build -f Dockerfile.dev -t quartermaster-dev:latest .
```

This keeps the dev image up to date automatically on the same workstation.

## Quality checks

- `npm run lint` runs TypeScript in `--noEmit` mode against both the frontend (`tsconfig.json`) and backend (`tsconfig.server.json`) configs to catch type regressions quickly.

## AI assistant & automation tips

- Keep the automation worker (`npm run worker:automation`) running alongside the API. Workflow events trigger tasks, invoices, and insights asynchronously through BullMQ/Redis.
- The in-app assistant (bot icon in the header) calls `/api/assistant`. You can test responses outside the UI via:
  ```bash
  curl -X POST http://localhost:4000/api/assistant \
    -H "Content-Type: application/json" \
    -d '{"prompt":"Summarize the pipeline"}'
  ```
- Subscribe to the SSE stream at `/api/events` if you are building integrations. Opportunity updates, workflow executions, and notification changes all emit events on this channel.
