# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Quartermaster is a full-stack CRM application with AI-powered automation features. It uses React + Vite frontend, Express backend, PostgreSQL database, Redis for job queues, and integrates with OpenAI's GPT-5-nano model for intelligent features.

## Development Commands

### Local Development
```bash
# Install dependencies (avoid paths with spaces on macOS)
npm install
npm run prisma:generate

# Start all services locally
npm run server:dev         # Express API on port 4000
npm run worker:automation  # BullMQ automation worker
npm run dev                # Vite dev server (separate terminal)

# Database operations
npm run prisma:migrate     # Run migrations
npm run prisma:studio      # Open Prisma Studio on port 5556
npm run db:seed            # Seed database

# Build & quality
npm run build              # Build frontend
npm run build:server       # Compile TypeScript server
npm run lint               # Type check both frontend & backend
```

### Docker Development
```bash
# Start all services (frontend, backend, db, redis, prisma-studio)
docker-compose -f docker-compose.dev.yml up --build

# Services exposed:
# - Frontend: http://localhost:5173
# - Backend API: http://localhost:4000
# - Prisma Studio: http://localhost:5556
# - PostgreSQL: localhost:5433
# - Redis: localhost:6379

# Production image
docker build -t quartermaster:latest .
docker run --env-file .env -p 4000:4000 quartermaster:latest
```

### Auto-rebuild Hook
Enable automatic Docker rebuilds on commit:
```bash
git config core.hooksPath .githooks
```

## Architecture

### Backend Structure (`server/`)
- **routes/**: API endpoints organized by entity (opportunities, accounts, contacts, etc.)
- **services/**: Business logic (workflow processor, integrations)
- **workers/**: Background job processors (`automationWorker.ts` processes BullMQ jobs)
- **jobs/**: Job definitions for automation queue
- **events/**: SSE event emitters for real-time updates
- **middleware/**: Express middleware (error handlers, etc.)
- **utils/**: Shared utilities

### Frontend Structure (`src/`)
- **App.tsx**: Main application shell with tab-based navigation
- **components/**: View components for each CRM entity
  - Pattern: `{Entity}View.tsx` for list views, `{Entity}DetailModal.tsx` for edit modals
  - Core views: HomeView, AccountsView, ContactsView, OpportunitiesView (via BZPipeline), InvoicesView, LeadsView, QuotesView, TasksView, etc.
- **types.ts**: Shared TypeScript types

### Database (Prisma)
- Schema: `prisma/schema.prisma` - PostgreSQL with enums for Stage, AccountType, TaskPriority, InvoiceStatus, etc.
- Main entities: Account, Contact, Lead, Opportunity, Task, Invoice, Quote, Contract, WorkflowRule, Notification, AIInsight
- Generate client after schema changes: `npm run prisma:generate`

### Key Integrations
- **OpenAI (GPT-5-nano)**: Invoice/form extraction (`routes/ai.ts`), assistant actions (`routes/assistantActions.ts`)
  - Uses `max_completion_tokens` parameter (not `max_tokens`)
  - Model: `gpt-5-nano`
- **BullMQ/Redis**: Asynchronous workflow automation, task scheduling
- **SSE Events**: `/api/events` endpoint for real-time updates
- **Google Drive/OneDrive**: File storage integrations

## Important Patterns

### Vite Proxy Configuration
- Frontend proxies `/api/*` to backend
- Docker: targets `http://backend:4000` when `DOCKER_ENV=true`
- Local: targets `http://localhost:4000`

### Environment Variables
- Required: `DATABASE_URL`, `OPENAI_API_KEY`, `PORT`
- Optional: `REDIS_URL`, `WEBHOOK_SECRET`, `GITHUB_TOKEN`
- Copy `.env.example` to `.env` for local development

### Docker Build Requirements
- `.dockerignore` includes `.env.*` but **excludes** `.env.example` (via `!.env.example` exception)
- Dockerfile installs OpenSSL for Prisma compatibility: `RUN apk add --no-cache openssl`
- Build order critical: `prisma:generate` → `build` → `build:server`

### TypeScript Configuration
- Frontend: `tsconfig.json`
- Backend: `tsconfig.server.json`
- Lint checks both configs: `npm run lint`
- Backend uses ESM modules (`.js` imports even for `.ts` files)

### API Type Assertions
When using `fetch().json()` with OpenAI or external APIs, add type assertion to avoid TS18046 errors:
```typescript
const data = await res.json() as any;
```

## Testing AI Features
```bash
# Test assistant endpoint
curl -X POST http://localhost:4000/api/assistant \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Summarize the pipeline"}'

# Monitor SSE event stream
curl http://localhost:4000/api/events
```

## Common Issues

1. **Opportunities page stuck loading**: Restart frontend container to clear Vite proxy cache
2. **Prisma OpenSSL errors**: Ensure `openssl` is installed in Alpine Docker images
3. **TypeScript build fails**: Run `prisma:generate` before `build:server`
4. **Docker build "file not found"**: Check `.dockerignore` hasn't excluded required files

## Workflow Automation
Keep `npm run worker:automation` running alongside the API. Workflow triggers (stage changes, task overdue, inactivity) queue jobs in Redis that execute actions (create tasks, send notifications, generate AI insights) asynchronously.
