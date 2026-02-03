# Build from monorepo root: docker build -f apps/dashboard/Dockerfile .
# Build-arg: VITE_API_BASE_URL (e.g. http://localhost:3000 or https://api.example.com)

FROM node:24-alpine AS builder

WORKDIR /app

ARG VITE_API_BASE_URL=http://localhost:3000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN corepack enable pnpm

# Install deps (monorepo)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/dashboard/package.json ./apps/dashboard/
RUN pnpm install --frozen-lockfile

# Copy app and build
COPY . .
RUN pnpm --filter @imedizin/dashboard build

# --- Serve with nginx ---
FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/apps/dashboard/dist /usr/share/nginx/html

# SPA: fallback to index.html for client-side routes; optional health
RUN echo 'server { \
  listen 80; \
  root /usr/share/nginx/html; \
  index index.html; \
  location / { try_files $uri $uri/ /index.html; } \
  location /health { return 200 "ok"; add_header Content-Type text/plain; } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
