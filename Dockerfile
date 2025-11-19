# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy workspace
COPY . .

# Generate Prisma client first, then build client & server
RUN npm run prisma:generate && npm run build && npm run build:server

# Remove devDependencies for smaller runtime image
RUN npm prune --omit=dev

# Production runtime
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.env.example ./env.example

EXPOSE 4000
CMD ["node", "dist-server/index.js"]
