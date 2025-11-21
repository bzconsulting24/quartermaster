# Quartermaster

> A modern, AI-powered CRM application built with React, Express, and PostgreSQL

Quartermaster is a full-stack customer relationship management platform featuring intelligent automation, document processing, and real-time insights.

## Features

- **AI-Powered Assistant** - Natural language interface for CRM operations
- **Document Intelligence** - PDF parsing and semantic search with RAG
- **Workflow Automation** - Event-driven task creation and notifications
- **Real-time Updates** - Server-sent events for live data synchronization
- **Vector Search** - Semantic document search using pgvector
- **Multi-entity CRM** - Accounts, contacts, opportunities, tasks, invoices, quotes, leads

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js, Express, Prisma ORM
- **Database:** PostgreSQL with pgvector extension
- **Queue:** BullMQ with Redis
- **AI:** OpenAI GPT-4o-mini, text-embedding-3-small

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- OpenAI API key

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/bzconsulting24/quartermaster.git
   cd quartermaster
   ```

2. Install dependencies
   ```bash
   npm install
   npm run prisma:generate
   ```

3. Configure environment variables
   ```bash
   cp .env.example .env
   # Edit .env with your database URL, Redis URL, and OpenAI API key
   ```

4. Run database migrations
   ```bash
   npm run prisma:migrate
   ```

5. Start development servers
   ```bash
   # Terminal 1: API server
   npm run server:dev

   # Terminal 2: Automation worker
   npm run worker:automation

   # Terminal 3: Frontend dev server
   npm run dev
   ```

6. Open http://localhost:5173

### Docker Development

Start all services with Docker Compose:

```bash
docker-compose -f docker-compose.dev.yml up --build
```

Services available at:
- Frontend: http://localhost:5173
- API: http://localhost:4000
- Prisma Studio: http://localhost:5556

## Documentation

- [Contributing Guidelines](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)

## Project Structure

```
quartermaster/
├── src/              # React frontend
├── server/           # Express backend
│   ├── routes/       # API endpoints
│   ├── services/     # Business logic
│   └── workers/      # Background job processors
├── prisma/           # Database schema and migrations
└── .github/          # GitHub templates and workflows
```

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on:

- Setting up your development environment
- Code style and conventions
- Submitting pull requests
- Reporting bugs

## License

See [LICENSE](LICENSE) for details.

## Support

- [Report a bug](https://github.com/bzconsulting24/quartermaster/issues/new?template=bug_report.yml)
- [Request a feature](https://github.com/bzconsulting24/quartermaster/issues/new?template=feature_request.yml)
- [Join discussions](https://github.com/bzconsulting24/quartermaster/discussions)

---

Built with ❤️ by the Quartermaster team
