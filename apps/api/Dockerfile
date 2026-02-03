# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Generate migration files (drizzle/ folder) so entrypoint can run migrate; dummy URL is enough for generate
ENV DATABASE_URL=postgres://localhost:5432/dummy
RUN npm run db:generate
RUN npm run build

# Production stage
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
COPY --from=builder /app/package.json package-lock.json ./
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/dist dist
COPY --from=builder /app/drizzle drizzle
COPY --from=builder /app/drizzle.config.ts drizzle.config.ts

# Optional: run migrations on startup (comment out if you run migrations separately)
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
