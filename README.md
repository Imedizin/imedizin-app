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

# Dashboard (port 5173)
pnpm --filter @imedizin/dashboard dev
```

The dashboard Vite config proxies `/api` to the API at `http://localhost:3000`.
