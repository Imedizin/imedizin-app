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

The dashboard Vite config proxies `/api` to the API at `http://localhost:3000`.
