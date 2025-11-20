# Quartermaster CRM - Setup & Usage Guide

## 🚀 Quick Start with Docker

### Prerequisites
- Docker Desktop installed and running
- Git installed
- (Optional) Tailscale for remote access

### Starting the Application

```bash
# Clone the repository
git clone https://github.com/bzconsulting24/quartermaster.git
cd quartermaster

# Start all services with Docker
docker-compose -f docker-compose.dev.yml up --build
```

### Access Points

Once running, access the application at:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000
- **Prisma Studio**: http://localhost:5556 (Database GUI)
- **PostgreSQL**: localhost:5433
- **Redis**: localhost:6379

## 🌐 Remote Access via Tailscale

The application is configured to work with Tailscale for secure remote access:

```
http://[your-machine].tail[xxxxx].ts.net:5173
```

**Why it works:**
- Vite is configured with `allowedHosts: ['.ts.net']` to accept Tailscale domains
- Frontend binds to `0.0.0.0` for network access
- All services exposed on their respective ports

### Enabling Tailscale (Optional)

1. Install Tailscale on your machine
2. Access via: `http://[hostname].tail[xxxxx].ts.net:5173`
3. For HTTPS (enables geolocation):
   ```bash
   tailscale cert [hostname].tail[xxxxx].ts.net
   ```

## 🎨 Recent Features (Latest)

### 1. User Profile System
- **Location**: Click your initials (top-right corner of header)
- **Features**:
  - View/edit your display name
  - AI assistant uses your name in responses
  - Dropdown menu with profile options
  - Sign out functionality (placeholder)

### 2. Interactive Task Management
- **Location**: Home dashboard
- **Features**:
  - Drag-and-drop to reorder tasks
  - Click checkbox to mark complete
  - Completed section with strikethrough styling
  - "Clear completed tasks" button
  - Smooth animations with framer-motion

### 3. Weather Widget
- **Location**: Home dashboard
- **Features**:
  - Auto-detects location via browser geolocation (HTTPS/localhost)
  - Falls back to IP geolocation (works via Tailscale)
  - Real-time temperature, humidity, wind speed
  - Weather condition icons

### 4. Quick Action Modals
Replaced system prompts with proper modal forms:
- **Create Task**: Full form with title, due date, priority, assignment
- **Schedule Meeting**: Meeting scheduler with opportunity linking
- **New Lead**: Complete lead form with AI assistance

## 🏗️ Architecture

### Multi-Process Setup
The application requires 3 separate processes:
1. **Frontend** (Vite) - Port 5173
2. **Backend** (Express) - Port 4000
3. **Worker** (BullMQ) - Background job processor

### Tech Stack
- **Frontend**: React + Vite + TypeScript
- **Backend**: Express + TypeScript + Prisma
- **Database**: PostgreSQL 15
- **Cache/Jobs**: Redis 7
- **AI**: OpenAI GPT-4o-mini
- **Animation**: Framer Motion

## 🛠️ Development Commands

### Docker (Recommended)

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up

# Rebuild and start
docker-compose -f docker-compose.dev.yml up --build

# Stop all services
docker-compose -f docker-compose.dev.yml down

# View logs
docker logs quartermaster-frontend
docker logs quartermaster-backend
docker logs quartermaster-db

# Restart a specific service
docker restart quartermaster-frontend
```

### Local Development (Alternative)

**⚠️ Note**: Requires Node.js 18-20 (Node 24 has compatibility issues)

```bash
# Install dependencies
npm install

# Terminal 1: Backend API
npm run server:dev

# Terminal 2: Automation Worker
npm run worker:automation

# Terminal 3: Frontend
npm run dev
```

### Database Operations

```bash
# Inside Docker container
docker exec -it quartermaster-backend npx prisma migrate dev
docker exec -it quartermaster-backend npx prisma generate
docker exec -it quartermaster-backend npx prisma studio

# Local
npm run prisma:migrate
npm run prisma:generate
npm run prisma:studio
```

## 📦 Project Structure

```
quartermaster/
├── src/                      # Frontend React components
│   ├── components/
│   │   ├── HomeView.tsx     # Dashboard with widgets
│   │   ├── BZHeader.tsx     # Header with user dropdown
│   │   ├── TaskCreateModal.tsx
│   │   ├── MeetingCreateModal.tsx
│   │   ├── WeatherWidget.tsx
│   │   └── UpcomingTasksWidget.tsx
│   ├── App.tsx              # Main application
│   └── types.ts             # TypeScript definitions
├── server/                   # Backend Express API
│   ├── routes/              # API endpoints
│   ├── services/            # Business logic
│   ├── workers/             # Background jobs
│   └── index.ts             # Server entry point
├── prisma/
│   └── schema.prisma        # Database schema
├── docker-compose.dev.yml   # Docker development setup
├── vite.config.ts           # Vite configuration
├── CLAUDE.md                # AI assistant instructions
└── SETUP.md                 # This file
```

## 🔧 Configuration Files

### vite.config.ts
```typescript
server: {
  host: true,                    // Bind to 0.0.0.0
  port: 5173,
  allowedHosts: [
    '.ts.net',                   // Tailscale domains
    'localhost',
    '.local'
  ],
  proxy: {
    '/api': {
      target: 'http://backend:4000'  // Docker service
    }
  }
}
```

### .env (Required)
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/quartermaster"
OPENAI_API_KEY="sk-..."
REDIS_URL="redis://localhost:6379"
PORT=4000
```

## 🐛 Troubleshooting

### Docker Issues

**Port already in use:**
```bash
# Kill processes on port 5173
netstat -ano | findstr :5173
taskkill /PID [PID] /F

# Or use different port in docker-compose.dev.yml
```

**Container won't start:**
```bash
# Clean rebuild
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up --build
```

**Frontend shows old code:**
```bash
# Hard refresh: Ctrl+Shift+R (Win) or Cmd+Shift+R (Mac)
# Or restart frontend container:
docker restart quartermaster-frontend
```

### Node.js Version Issues

**Error: "Cannot find package 'cors'"**
- **Cause**: Node v24 has ESM compatibility issues
- **Solution**: Use Docker (recommended) or downgrade to Node 20 LTS

**Nodemon error: "directories is not a function"**
- **Cause**: Node v24 incompatibility
- **Solution**: Use Docker or update ignore-by-default package

### Geolocation/Weather Issues

**Weather shows wrong location:**
- Browser geolocation only works on HTTPS or localhost
- Via Tailscale: Uses IP-based geolocation
- Check browser console for geolocation messages

**Weather widget not loading:**
- Check if wttr.in API is accessible
- Verify Docker has internet access
- Check browser console for errors

### Tailscale Access Issues

**"Host not allowed" error:**
- Ensure `vite.config.ts` has `.ts.net` in `allowedHosts`
- Restart frontend container after config changes

**Can't access via Tailscale:**
1. Verify Tailscale is running on both machines
2. Check firewall allows port 5173
3. Test with: `curl http://[hostname].tail[xxx].ts.net:5173`

## 📝 Recent Updates

### Commit: 1337e86 (Latest)
- Added Tailscale host support in Vite config
- IP-based geolocation fallback for weather widget

### Commit: ffe42b5
- User profile dropdown in header
- Task drag-and-drop with animations
- Weather widget with geolocation
- Modal forms for Quick Actions
- Completed tasks section with strikethrough
- Removed AI Insights section

### Commit: 6a2686e
- Enhanced AI assistant with full CRM context
- Multilingual support (English/Tagalog)
- ADHD-friendly response formatting

## 🤝 Contributing

### Making Changes

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes, test in Docker
docker-compose -f docker-compose.dev.yml up --build

# Commit with conventional commits
git add .
git commit -m "feat: add awesome feature"

# Push and create PR
git push origin feature/your-feature
```

### Commit Message Format

```
feat: add new feature
fix: resolve bug
docs: update documentation
style: format code
refactor: restructure code
test: add tests
chore: update dependencies
```

## 📚 Additional Resources

- **CLAUDE.md**: Instructions for AI assistant working with this codebase
- **README.md**: Project overview and basic info
- **Prisma Studio**: http://localhost:5556 for database exploration
- **API Documentation**: Check `server/routes/` for available endpoints

## 🔐 Security Notes

- Never commit `.env` files with real API keys
- Use environment variables for all secrets
- Tailscale provides encrypted connections
- Consider using Tailscale ACLs for production

## 📞 Support

For issues or questions:
1. Check this SETUP.md
2. Check CLAUDE.md for architecture details
3. Review Docker logs: `docker logs [container-name]`
4. Check GitHub issues

---

**Last Updated**: 2025-11-20
**Version**: Latest (commit 1337e86)
