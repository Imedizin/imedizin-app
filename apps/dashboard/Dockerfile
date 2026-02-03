# Build stage – set API URL at build time for production
FROM node:24-alpine AS builder

WORKDIR /app

# API base URL (no trailing slash). Override when building: --build-arg VITE_API_BASE_URL=https://api.yourdomain.com
ARG VITE_API_BASE_URL=https://api.yourdomain.com
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# Serve with Nginx
FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/dist /usr/share/nginx/html

# SPA: serve index.html for client-side routes
RUN echo 'server { \
  listen 80; \
  root /usr/share/nginx/html; \
  index index.html; \
  location / { try_files $uri $uri/ /index.html; } \
  location /health { return 200 "ok"; add_header Content-Type text/plain; } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
