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
RUN pnpm --filter @imedizin/api build

# --- Production stage ---
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy monorepo config files to root
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./

# Copy app-specific files
# COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/drizzle ./drizzle
COPY --from=builder /app/apps/api/drizzle.config.ts ./
COPY --from=builder /app/apps/api/docker-entrypoint.sh ./

RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/src/main.js"]
