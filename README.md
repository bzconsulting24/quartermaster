# Quartermaster

## Local development

1. Copy `.env.example` to `.env` and update `DATABASE_URL` for your PostgreSQL instance.
2. Install dependencies and generate the Prisma client:
   ```bash
   npm install
   npm run prisma:generate
   ```
3. Start both Vite and the Express API locally:
   ```bash
   npm run dev:docker
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
