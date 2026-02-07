# Build from monorepo root: docker build -f apps/api/Dockerfile .
# Multi-stage: builder (pnpm + build) -> runner (node + migrations + app)

FROM node:24-alpine AS builder

WORKDIR /app

RUN corepack enable pnpm

# Install deps (monorepo)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/dashboard/package.json ./apps/dashboard/
RUN pnpm install --frozen-lockfile

# Copy app and build
COPY . .
# ENV DATABASE_URL=postgresql://localhost:5432/dummy
RUN pnpm --filter @imedizin/api build

# --- Production stage ---
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Monorepo layout: node_modules at root, app in apps/api
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./apps/api/
COPY --from=builder /app/node_modules ./apps/api/node_modules
# COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/drizzle ./apps/api/drizzle
COPY --from=builder /app/apps/api/drizzle.config.ts ./apps/api/
COPY --from=builder /app/apps/api/docker-entrypoint.sh ./apps/api/

WORKDIR /app/apps/api

RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/src/main.js"]
