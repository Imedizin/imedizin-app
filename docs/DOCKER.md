# Docker setup and best practices

## Quick start

From the **monorepo root**:

```bash
# Build and run all services (Postgres, Redis, API, dashboard)
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

- **API:** http://localhost:3000  
- **Dashboard:** http://localhost:8080  
- **Postgres:** localhost:5432 (user `postgres`, password `postgres`, db `imedizin`)  
- **Redis:** localhost:6379  

The dashboard build uses `VITE_API_BASE_URL=http://localhost:3000` by default so it talks to the API when both run via Compose.

---

## Best practices used in this repo

### 1. **Multi-stage builds**
- **API:** `builder` (Node 24, pnpm install + build) → `runner` (only runtime + `node_modules` + app).
- **Dashboard:** `builder` (Node 24, pnpm + Vite build) → `nginx` (only static files).
- Result: smaller images, no dev deps or source in production.

### 2. **Build from monorepo root**
- `docker compose build` uses **context: `.`** (root) and **dockerfile: apps/api/Dockerfile** (or dashboard).
- Dockerfiles assume they are built from root: `COPY . .`, then `pnpm --filter @imedizin/api build`.
- Single source of truth, correct workspace resolution, no copying between repos.

### 3. **.dockerignore**
- Ignore `node_modules`, `dist`, `.git`, `.env`, tests, IDE files.
- Speeds up build and keeps secrets and dev artifacts out of the image.

### 4. **Dependency and layer order**
- Copy **package files first**, then `pnpm install`, then **application code**.
- Code changes don’t invalidate the install layer, so rebuilds are faster.

### 5. **Healthchecks for dependencies**
- Postgres: `pg_isready`; Redis: `redis-cli ping`.
- API service uses `depends_on: postgres: condition: service_healthy` (and same for Redis) so the app starts only when DB and Redis are ready.

### 6. **Secrets and env**
- **Compose:** Set `DATABASE_URL`, `REDIS_HOST`, etc. in `docker-compose.yml` (or use env_file / `.env` for overrides). No secrets in Dockerfiles.
- **Build-time:** Only non-secret build args (e.g. `VITE_API_BASE_URL`) in Dockerfile; no credentials.

### 7. **Single process per container**
- API: one process (`node dist/main.js`).
- Dashboard: nginx serving static files.
- No supervisor or multiple apps in one container.

### 8. **Migrations at startup**
- API entrypoint runs `drizzle-kit migrate` before starting the app when `DATABASE_URL` is set.
- For production, you can instead run migrations in CI or a one-off job and remove from entrypoint.

### 9. **Alpine base**
- **Node 24**, **Postgres 18**, **Redis 7**: `node:24-alpine`, `postgres:18-alpine`, `redis:7-alpine`, `nginx:alpine` for smaller images.

### 10. **Named volumes**
- `postgres_data` and `api_attachments` so data survives `docker compose down` and restarts.

---

## Production / deploy tips

| Topic                     | Recommendation                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **API URL for dashboard** | Build with `--build-arg VITE_API_BASE_URL=https://api.yourdomain.com` (or set in compose `build.args`).                        |
| **Secrets**               | Use Docker secrets, or env from your orchestrator (e.g. Kubernetes secrets, ECS task env), not plain env in committed compose. |
| **Migrations**            | Optionally run in CI or a one-off job instead of in the API entrypoint.                                                        |
| **Logs**                  | Stdout/stderr; configure your platform to collect them (e.g. CloudWatch, Datadog).                                             |
| **Scaling**               | Scale `api` (and optionally dashboard) with your orchestrator; keep one Postgres/Redis or use managed services.                |

---

## Commands reference

```bash
# Build (no cache)
docker compose build --no-cache

# Build only API
docker compose build api

# Run in foreground (see logs)
docker compose up

# Run only infra (Postgres + Redis)
docker compose up -d postgres redis

# Shell into API container
docker compose exec api sh

# DB migrate manually
docker compose exec api sh -c "npx drizzle-kit migrate"
```
