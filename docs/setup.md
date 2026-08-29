# Setup Guide

This guide walks through cloning the **Daily Corner** repository from GitHub and getting the full Turborepo monorepo (apps + shared packages) running locally.

## 1. Prerequisites

Install the following before you start:

| Tool       | Version    | Notes                                              |
| ---------- | ---------- | --------------------------------------------------- |
| Node.js    | `>= 20`    | See `engines.node` in the root `package.json`.       |
| pnpm       | `10.33.4`  | Managed via Corepack (see below). Do not use npm/yarn. |
| Git        | any recent | Used to clone the repo and manage branches.          |
| PostgreSQL | any recent | Local instance or a hosted Postgres URL (e.g. Prisma Postgres) for the `@repo/db` package. |

This repo is a **pnpm workspace** managed by **Turborepo** — always run commands from the repo root unless a step says otherwise.

## 2. Clone the repository

```bash
git clone https://github.com/<your-org>/NEWSer.git
cd NEWSer
```

## 3. Enable Corepack and pnpm

The root `package.json` pins `"packageManager": "pnpm@10.33.4"`. Use Corepack so everyone on the team runs the exact same pnpm version:

```bash
corepack enable
corepack prepare pnpm@10.33.4 --activate
```

## 4. One-command setup (recommended)

After cloning, copy env templates and put a real Postgres URL in `packages/database/.env`, then run:

```bash
pnpm run setup
```

> Use `pnpm run setup` (not `pnpm setup`). Plain `pnpm setup` is a pnpm CLI command that configures pnpm itself.

This will:

1. Create missing `.env` files from each workspace's `example.env`
2. Validate required env vars (especially `DATABASE_URL`)
3. Run `pnpm install`
4. Check the database connection
5. Apply Prisma migrations (`db:deploy`)
6. Generate the Prisma client

Do **not** run `pnpm install` inside individual `apps/*` or `packages/*` folders; the workspace is resolved from the root.

## 5. Configure environment variables (manual)

Each app/package has an `example.env`. The setup script copies these to `.env` when missing. At minimum you must set a real connection string:

```bash
# packages/database/.env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"
```

If any app or package later requires its own secrets (e.g. Google OAuth client ID/secret and `JWT_SECRET` for `apps/server`), fill them in that workspace's `.env` (from its `example.env`). Full Google OAuth, cookie, and admin-email behavior is documented in [auth-google-oauth.md](./auth-google-oauth.md).

## 6. Database commands (manual)

All Prisma commands live on the `@workspace/db` package:

```bash
# Generate the Prisma client into packages/database/generated
pnpm --filter @workspace/db db:generate

# Create/apply migrations interactively (local development)
pnpm --filter @workspace/db db:migrate

# Apply existing migrations without prompting (setup / CI / production)
pnpm --filter @workspace/db db:deploy
```

You can also run these from Turborepo directly:

```bash
pnpm turbo db:generate
pnpm turbo db:migrate
```

## 7. Run the apps

Start every app in dev mode (with hot reload) in parallel:

```bash
pnpm dev
```

This runs the `dev` task through Turborepo, which is marked `persistent`/non-cached in `turbo.json`. `web` binds to `http://localhost:3000`, `admin` to `http://localhost:3001`, and `server` to `http://localhost:4000`.

To run a single app instead:

```bash
pnpm --filter web dev
pnpm --filter admin dev
```

## 8. Other useful commands

Run from the repo root, these fan out to every workspace via Turborepo:

```bash
pnpm build       # turbo build — production build for all apps
pnpm lint        # turbo lint — ESLint across every workspace
pnpm format      # turbo format — Prettier formatting
pnpm typecheck   # turbo typecheck — `tsc --noEmit` for every workspace
```

## 9. Project structure

```
apps/
  web/      Public-facing Next.js app
  admin/    Admin dashboard Next.js app

packages/
  database/            @repo/db      Prisma schema, migrations & generated client
  auth/                @workspace/auth Shared cookie name and Google login URLs
  types/               @workspace/types Shared TypeScript types / zod schemas
  ui/                  @workspace/ui               Shared shadcn/ui component library
  eslint-config/       @workspace/eslint-config     Shared ESLint flat configs
  typescript-config/   @workspace/typescript-config Shared tsconfig base configs
```

## 10. Troubleshooting

- **`pnpm install` fails on engines check** — confirm `node -v` reports `20.x` or newer.
- **Prisma commands fail to connect** — confirm `DATABASE_URL` in `packages/database/.env` is correct and the database is reachable.
- **Type errors after pulling new changes** — run `pnpm --filter @workspace/db db:generate` again; the Prisma client is generated code and is not committed to git.
- **`pnpm setup` does nothing useful for this repo** — that is pnpm's own CLI. Use `pnpm run setup` instead.
- **Wrong pnpm version** — re-run `corepack prepare pnpm@10.33.4 --activate`; mismatched package managers can produce a different lockfile/hoisting layout.

See [`docs/instructions.md`](./instructions.md) for the coding standards to follow once your environment is set up. See [`docs/redux.md`](./redux.md) for Redux Toolkit and RTK Query conventions.
