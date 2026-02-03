# iMedizin

Monorepo with pnpm workspaces and Turborepo.

## Structure

```
imedizin-app/
├── apps/
│   ├── api/          # NestJS API
│   └── dashboard/    # React (Vite) dashboard
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

## Prerequisites

- Node.js >= 20
- pnpm 9.x
- **Postgres** and **Redis** (for the API – queues, webhooks)

## Setup

```bash
pnpm install
```

## Environment variables

Use per-app `.env` files (git-ignored). Copy the examples:

| App       | Copy to                                               |
| --------- | ----------------------------------------------------- |
| API       | `apps/api/.env.example` → `apps/api/.env`             |
| Dashboard | `apps/dashboard/.env.example` → `apps/dashboard/.env` |

- **API**: Loaded from `apps/api` when you run `pnpm --filter @imedizin/api dev`.
- **Dashboard**: Leave `VITE_API_BASE_URL` empty in dev to use the Vite proxy (`/api` → API on port 3000).

## Scripts

| Command      | Description              |
| ------------ | ------------------------ |
| `pnpm dev`   | Run all apps in dev mode |
| `pnpm build` | Build all apps           |
| `pnpm lint`  | Lint all apps            |

## Run apps individually

```bash
# API (port 3000)
pnpm --filter @imedizin/api dev

# Dashboard (port 8080)
pnpm --filter @imedizin/dashboard dev
```

**Local dev: Postgres + Redis required for the API.**  
If you see `ECONNREFUSED 127.0.0.1:6379`, Redis isn’t running. Either:

- Start only infra with Docker: `docker compose up -d postgres redis`  
  (then use `apps/api/.env` with `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/imedizin`, `REDIS_HOST=localhost`, `REDIS_PORT=6379`), or  
- Install and run Postgres and Redis locally (e.g. Homebrew, or your OS package manager).

The dashboard Vite config proxies `/api` to the API at `http://localhost:3000`.

## Docker

Run the full stack (Postgres, Redis, API, dashboard) with Docker Compose from the **repo root**:

```bash
docker compose up -d
```

- **API:** http://localhost:3000  
- **Dashboard:** http://localhost:8080  

Build args: set `VITE_API_BASE_URL` for the dashboard (e.g. in `docker-compose.yml` or `--build-arg`) so the frontend calls the correct API in production.

See [docs/DOCKER.md](docs/DOCKER.md) for details and **Docker best practices**.
