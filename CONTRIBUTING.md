# Contributing to Quartermaster

Thank you for your interest in contributing to Quartermaster! This document provides guidelines for contributing to the project.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 6+
- Docker (optional, for containerized development)

### Setup

1. Fork and clone the repository
2. Install dependencies:
   ```bash
   npm install
   npm run prisma:generate
   ```
3. Copy `.env.example` to `.env` and configure your environment variables
4. Run database migrations:
   ```bash
   npm run prisma:migrate
   ```

### Development

Start the development servers (requires 3-4 terminals):

```bash
# Terminal 1: API server
npm run server:dev

# Terminal 2: Automation worker
npm run worker:automation

# Terminal 3: Embedding worker (optional)
npm run worker:embeddings

# Terminal 4: Frontend dev server
npm run dev
```

Alternatively, use Docker:
```bash
docker-compose -f docker-compose.dev.yml up --build
```

## Code Guidelines

### Style

- **Indentation:** 2 spaces (no tabs)
- **Components:** PascalCase (e.g., `AccountsView.tsx`)
- **Functions/Variables:** camelCase (e.g., `getUserData`)
- **Exports:** Explicit exports preferred over default exports
- **Imports:** Use `.js` extension for ESM imports in backend code

### TypeScript

- Run type checks before committing:
  ```bash
  npm run lint
  ```
- Avoid `any` types when possible
- Use type assertions for external API responses

### File Organization

- **Frontend:** `src/components/` for React components
- **Backend:** `server/routes/` for API endpoints, `server/services/` for business logic
- **Database:** Update `prisma/schema.prisma` and run `npm run prisma:generate`

## Submitting Changes

### Pull Requests

1. Create a feature branch from `main`
2. Make your changes following the code guidelines
3. Test your changes thoroughly
4. Run linting and type checks
5. Commit with clear messages
6. Push to your fork and submit a pull request

### Commit Messages

Keep commit messages concise:
- Use present tense ("Add feature" not "Added feature")
- Keep the first line under 50 characters
- Reference issue numbers when applicable

Examples:
```
Add user authentication
Fix dashboard loading issue
Update documentation
```

### Testing

- Ensure all existing functionality works
- Test edge cases and error handling
- Verify database migrations run successfully

## Reporting Issues

When reporting bugs, please include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (OS, Node version, etc.)
- Relevant logs or error messages

## Development Tips

- Use `npm run prisma:studio` to explore the database
- Check `server/index.ts` to understand route structure
- Frontend proxies `/api/*` requests to the backend
- Use `asyncHandler` wrapper for all async route handlers

## Questions?

If you have questions or need help, feel free to open an issue for discussion.

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
