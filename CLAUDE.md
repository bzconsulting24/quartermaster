# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Quartermaster is a full-stack CRM application with AI-powered automation features. It uses React + Vite frontend, Express backend, PostgreSQL database, Redis for job queues, and integrates with OpenAI's GPT-5-nano model for intelligent features.

**Multi-Process Architecture**: The application requires three separate processes in development:
1. Express API server (`npm run server:dev`) - handles HTTP requests
2. BullMQ automation worker (`npm run worker:automation`) - processes async jobs
3. Vite dev server (`npm run dev`) - serves frontend with HMR

**IMPORTANT**: Clone the repo into a directory **without spaces** in the path (e.g., `~/workspace/quartermaster`). `npm install` fails on macOS when the path includes spaces.

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
# - Frontend (Vite): http://localhost:5173
# - Backend API: http://localhost:4000
# - Prisma Studio: http://localhost:5556
# - PostgreSQL: localhost:5433 (maps to internal 5432)
# - Redis: localhost:6379

# Backend includes both API server AND automation worker (ENABLE_WORKER_EVENTS=true)
# Frontend container runs Vite dev server with hot reload
# Source files are bind-mounted for live updates

# Production image (single-process: API + static files, no separate worker)
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
- **index.ts**: Express app setup, middleware, route registration
  - Mounts 27+ route handlers under `/api/*` prefixes
  - Serves static frontend bundle (`dist/`) in production when available
  - Uses catch-all route for SPA fallback (routes non-API paths to `index.html`)
  - Health check available at `/api/health`
- **prismaClient.ts**: Singleton Prisma instance (prevents connection pool issues)
- **routes/**: API endpoints organized by entity
  - Core CRUD: `accounts.ts`, `contacts.ts`, `opportunities.ts`, `tasks.ts`, `leads.ts`
  - Business logic: `invoices.ts`, `quotes.ts`, `contracts.ts`, `products.ts`
  - AI features: `ai.ts` (PDF extraction), `assistant.ts`, `assistantActions.ts`, `assistantMemory.ts`, `assistantFileAnalysis.ts`, `assistantAgentic.ts`, `assistantWorkflow.ts`, `insights.ts`
  - Automation: `workflows.ts`, `workflowRules.ts`
  - Integrations: `drive.ts`, `onedrive.ts`, `webhook.ts`, `ingest.ts`
  - Utilities: `overview.ts` (dashboard), `reports.ts`, `search.ts`, `events.ts` (SSE), `activities.ts`
  - **helpers.ts**: `asyncHandler` wrapper for error handling
- **services/**: Business logic (`workflowProcessor.ts` - core automation engine that evaluates WorkflowRules and executes actions)
- **workers/**: Background job processors (`automationWorker.ts` processes BullMQ jobs from Redis)
- **jobs/**: Job queue definitions (`automationQueue.ts`)
- **events/**: SSE event emitters (`eventBus.ts` - `emitAppEvent()` broadcasts real-time updates)
- **middleware/**: Express middleware (`errorHandler.ts`)
- **utils/**: Shared utilities (`stageUtils.ts`, `googleDrive.ts`, `oneDrive.ts`, `aiMemory.ts`)
- **config/**: Configuration (`redis.ts`)

### Frontend Structure (`src/`)
- **App.tsx**: Main application shell with tab-based navigation
  - Uses React Router with path-to-tab mapping (`/opportunities`, `/accounts`, etc.)
  - Manages global state for opportunities, notifications, assistant panel, command palette
  - Keyboard shortcuts: CMD+K (command palette), CMD+/ (assistant toggle)
  - Focus mode support for distraction-free work
- **components/**: View components for each CRM entity
  - Pattern: `{Entity}View.tsx` for list views, `{Entity}DetailModal.tsx` for edit modals
  - Core views: HomeView, AccountsView, ContactsView, InvoicesView, LeadsView, QuotesView, TasksView, CalendarView, ReportsView, ContractsView, CustomerInformationView
  - **BZPipeline.tsx**: Special Kanban board component for opportunities with drag-drop stage management
  - **AssistantPanel.tsx**: AI chat interface that calls `/api/assistant` endpoints
  - **CommandPalette.tsx**: Keyboard shortcut menu (CMD+K) for quick navigation
  - **BZHeader.tsx**: Top navigation bar with user menu, notifications, assistant toggle
  - **NavigationTabs.tsx**: Tab navigation component for switching between views
  - **AIFloatingButton.tsx**: Floating action button to open assistant panel
  - **NotificationsPanel.tsx**: Side panel for real-time notifications
  - **SettingsModal.tsx**: User settings and preferences
- **types.ts**: Shared TypeScript types (Opportunity, Account, Contact, Task, Invoice, etc.)
- **data/uiConstants.ts**: Color schemes, currency formatting (PHP), date utilities, stage colors

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

### Error Handling Pattern
All route handlers use the `asyncHandler` wrapper from `routes/helpers.ts`:
```typescript
router.get('/api/accounts', asyncHandler(async (req, res) => {
  // Any thrown errors or rejected promises automatically caught
  const accounts = await prisma.account.findMany();
  res.json(accounts);
}));
```
The `asyncHandler` passes errors to Express error handler middleware, preventing unhandled promise rejections. **Always wrap async route handlers** with this utility.

### Stage Utilities
Opportunity stages are stored as enums (`ProposalPriceQuote`) but displayed as labels (`"Proposal/Price Quote"`). Use `utils/stageUtils.ts`:
- `stageEnumToLabel()`: Convert database enum to display string
- `stageLabelToEnum()`: Convert user input back to enum

Routes automatically serialize opportunities with readable stage labels before sending responses.

### React Component Patterns
- **List Views**: `{Entity}View.tsx` (e.g., `AccountsView.tsx`, `ContactsView.tsx`)
  - Fetch data on mount/tab change
  - Render tables/cards with action buttons
  - Handle modal open/close state
- **Edit Modals**: `{Entity}EditModal.tsx` or `{Entity}DetailModal.tsx`
  - Accept `onClose` callback and optional entity for editing
  - Submit to API and call `onClose(true)` on success
  - Parent view refetches data when modal closes with success=true

### Real-Time Updates (SSE)
- Backend emits events via `events/eventBus.ts` → `eventEmitter.emit('workflow.executed', data)`
- SSE endpoint `/api/events` streams events to connected clients
- Frontend components can subscribe to real-time notifications, workflow updates, opportunity changes

### Vite Proxy Configuration
- Frontend proxies `/api/*` to backend (configured in `vite.config.ts`)
- Docker: targets `http://backend:4000` when `DOCKER_ENV=true` environment variable is set
- Local: targets `http://localhost:4000` for standalone development
- Vite dev server also allows Tailscale hosts (`.ts.net`) and local network access (`.local`)

### Environment Variables
- Required: `DATABASE_URL`, `OPENAI_API_KEY`, `PORT`
- Optional: `REDIS_URL`, `WEBHOOK_SECRET`, `GITHUB_TOKEN`, `NODE_ENV`, `DOCKER_ENV`, `ENABLE_WORKER_EVENTS`
- Copy `.env.example` to `.env` for local development
- Docker compose automatically overrides `DATABASE_URL` and `REDIS_URL` to use container service names

### Docker Build Requirements
- `.dockerignore` includes `.env.*` but **excludes** `.env.example` (via `!.env.example` exception)
- Dockerfile installs OpenSSL for Prisma compatibility: `RUN apk add --no-cache openssl`
- Build order critical: `prisma:generate` → `build` → `build:server`

### Prisma Client Singleton
The backend uses a singleton pattern in `server/prismaClient.ts` to prevent connection pool exhaustion during development (hot reload creates new connections). All routes import this shared instance:
```typescript
import prisma from '../prismaClient.js';  // Note .js extension for ESM
```

### TypeScript Configuration
- Frontend: `tsconfig.json` (React/browser environment)
- Backend: `tsconfig.server.json` (Node.js/ESM environment)
- Lint checks both configs: `npm run lint`
- **ESM imports**: Backend uses ES modules with `.js` extensions in imports even for `.ts` source files
  - Example: `import { foo } from './utils/bar.js'` (bar.ts compiles to bar.js)
  - This is required for Node.js ESM module resolution

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

1. **Opportunities page stuck loading**: Restart frontend container to clear Vite proxy cache (`docker-compose restart frontend`)
2. **Prisma OpenSSL errors**: Ensure `openssl` is installed in Alpine Docker images (`apk add --no-cache openssl`)
3. **TypeScript build fails**: Run `npm run prisma:generate` before `npm run build:server` (Prisma client must be generated first)
4. **Docker build "file not found"**: Check `.dockerignore` hasn't excluded required files (note: `.env.example` is explicitly included via `!.env.example`)
5. **Background jobs not processing**: Ensure `npm run worker:automation` is running alongside API server, or use Docker compose which runs both in backend container
6. **Port conflicts**: Check if ports 4000 (API), 5173 (Vite), 5433 (Postgres), 6379 (Redis), or 5556 (Prisma Studio) are already in use

## Workflow Automation Architecture

The workflow system uses an event-driven architecture to decouple triggers from execution:

### Flow: Trigger → Queue → Worker → Execute → Emit
1. **Trigger**: API routes detect events (opportunity stage change, task overdue, inactivity)
2. **Queue**: Event enqueued to BullMQ via `jobs/automationQueue.ts` → `automationQueue.add(jobData)`
3. **Worker**: `workers/automationWorker.ts` polls Redis and picks up jobs
4. **Execute**: `services/workflowProcessor.ts` evaluates WorkflowRules and executes WorkflowActions
5. **Emit**: `events/eventBus.ts` broadcasts real-time updates via SSE to `/api/events`

### Workflow Actions
- **CREATE_TASK**: Auto-generate follow-up tasks based on stage changes
- **SEND_EMAIL**: Trigger notifications via nodemailer
- **INVOKE_AI**: Generate AI insights using GPT-5-nano
- **CREATE_INVOICE**: Auto-create invoices when opportunities reach "Closed Won"

**Critical**: Keep `npm run worker:automation` running alongside the API server, otherwise queued jobs will accumulate in Redis without being processed.

### Git Workflow Integration
The repository uses a post-commit hook to automatically rebuild Docker images on every commit. This ensures development images stay synchronized with code changes. The hook rebuilds `Dockerfile.dev` after each commit. Make sure to push commits to GitHub as workflows depend on this for deployments.