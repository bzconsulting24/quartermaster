# WSL Migration Plan - Quartermaster CRM

**Date:** 2025-11-20
**Reason:** Fixing Docker networking issues on Windows

## Problem Statement

The backend container is crashing with Redis DNS resolution errors:
```
Error: getaddrinfo ENOTFOUND redis
```

**Root Cause:**
- Docker on Windows has networking issues with container-to-container DNS resolution
- Backend cannot resolve the `redis` hostname even though containers are on the same network
- Both `embeddingQueue` and `automationQueue` create BullMQ Queue instances at module-load time
- These queues immediately attempt to connect to Redis, causing connection failures

## Current State (Before Migration)

**Environment:** Windows with Docker Desktop + Git Bash
- Working directory: `D:\julius\codes\quartermaster\quartermaster`
- Docker Compose file: `docker-compose.dev.yml`
- Database: PostgreSQL with pgvector (ankane/pgvector:v0.5.1)
- Redis: redis:7-alpine
- Containers: backend, frontend, db, redis, prisma-studio

**What We've Tried:**
1. ✅ Built Docker images with pgvector support
2. ✅ Applied Prisma migrations (pgvector extension enabled)
3. ✅ Configured `REDIS_URL=redis://redis:6379` in docker-compose
4. ❌ Backend still cannot resolve Redis hostname

**Cleanup Completed:**
```bash
docker-compose -f docker-compose.dev.yml down -v
```
- All containers stopped and removed
- All volumes deleted (postgres_data, redis_data)
- Network removed

## Migration Plan

### Phase 1: WSL Setup
1. Ensure WSL2 is installed and set as default
2. Ensure Docker Desktop WSL2 integration is enabled
3. Open WSL terminal (Ubuntu)

### Phase 2: Project Setup in WSL
1. **Option A - Use existing Windows files (quick test):**
   ```bash
   cd /mnt/d/julius/codes/quartermaster/quartermaster
   ```

2. **Option B - Clone in WSL filesystem (recommended for performance):**
   ```bash
   cd ~
   git clone <repo-url> quartermaster
   cd quartermaster
   cp /mnt/d/julius/codes/quartermaster/quartermaster/.env .
   ```

### Phase 3: Start Services in WSL
```bash
# Generate Prisma client
npm run prisma:generate

# Start Docker Compose
docker-compose -f docker-compose.dev.yml up --build

# In separate terminals (after containers are healthy):
npm run server:dev              # Express API + routes
npm run worker:automation       # BullMQ automation worker
npm run worker:embeddings       # BullMQ embedding worker (NEW)
```

### Phase 4: Verify Services
- Backend API: http://localhost:4000/api/health
- Frontend: http://localhost:5173
- Prisma Studio: http://localhost:5556
- Database: localhost:5433 (PostgreSQL with pgvector)
- Redis: localhost:6379

**Check for Redis connectivity:**
```bash
docker-compose -f docker-compose.dev.yml logs backend | grep -i redis
# Should see no ENOTFOUND errors
```

## Expected Outcomes

### Fixed Issues
✅ Backend can resolve `redis://redis:6379` via Docker DNS
✅ BullMQ queues connect successfully
✅ Embedding worker can process PDF vectorization jobs
✅ Automation worker can process workflow jobs
✅ No more "getaddrinfo ENOTFOUND redis" errors

### Additional Benefits
✅ Better file I/O performance
✅ Native Linux environment (matches production)
✅ More stable PostgreSQL/Redis connections
✅ Faster npm install times

## Rollback Plan

If WSL doesn't work, we can:
1. Make Redis connection lazy/optional in queue files
2. Only initialize queues when actually needed (not at module-load)
3. Add retry logic with better error handling
4. Fall back to Windows Docker with lazy queue initialization

## Key Files Modified (Recent Changes)

**New Files (PDF Vectorization Feature):**
- `server/services/embeddingService.ts` - OpenAI embedding generation
- `server/services/chunkingService.ts` - Text chunking logic
- `server/jobs/embeddingQueue.ts` - BullMQ queue for embeddings
- `server/workers/embeddingWorker.ts` - Background worker for embeddings
- `server/routes/vectorSearch.ts` - Semantic search API
- `prisma/migrations/20250120000000_add_pgvector_and_document_chunks/` - pgvector migration

**Modified Files:**
- `docker-compose.dev.yml` - Changed db image to ankane/pgvector:v0.5.1
- `prisma/schema.prisma` - Added DocumentChunk model with vector(1536)
- `server/index.ts` - Registered vectorSearch router
- `server/routes/ingest.ts` - Added auto-embedding for PDFs
- `server/routes/assistantFileAnalysis.ts` - Added auto-embedding for Excel/CSV
- `server/services/assistantService.ts` - Added RAG with search_documents function

## Environment Variables Required

```bash
# Required
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/quartermaster?schema=public"
OPENAI_API_KEY="sk-svcacct-..."
PORT=4000

# Optional (will use defaults if not set)
REDIS_URL="redis://localhost:6379"  # Will be redis://redis:6379 in Docker
WEBHOOK_SECRET="..."
GITHUB_TOKEN="..."
```

## Post-Migration Tasks

1. Test PDF upload with auto-embedding
2. Test semantic search via `/api/vector-search/query`
3. Test AI assistant with document search function
4. Verify embedding worker processes jobs correctly
5. Verify automation worker still works
6. Update CLAUDE.md with WSL development instructions

## Notes

- The Redis connection issue is a known problem with Docker Desktop on Windows
- WSL2 provides proper Linux kernel support for Docker networking
- File performance is much better when working in WSL filesystem (`~/`) vs mounted Windows drives (`/mnt/`)
- We can still access files from Windows Explorer via `\\wsl$\Ubuntu\home\<username>\quartermaster`
