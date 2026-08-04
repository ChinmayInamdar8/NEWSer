# Setup Guide

This guide walks through cloning the **NEWSer** repository from GitHub and getting the full Turborepo monorepo (apps + shared packages) running locally.

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

## 4. Install dependencies

Run this once from the repo root — it installs and links every app and package declared in `pnpm-workspace.yaml` (`apps/*` and `packages/*`):

```bash
pnpm install
```

Do **not** run `pnpm install` inside individual `apps/*` or `packages/*` folders; the workspace is resolved from the root.

## 5. Configure environment variables

The `@repo/db` package (`packages/database`) needs a Postgres connection string. Create a `.env` file there (it is git-ignored and must never be committed):

```bash
# packages/database/.env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"
```

If any app or package later requires its own secrets (e.g. NextAuth secrets for `@repo/auth`), add a local `.env` next to that package/app following the same pattern, and document the required keys in that package's README.

## 6. Set up the database

All Prisma commands live on the `@repo/db` package and are exposed as scripts:

```bash
# Generate the Prisma client into packages/database/generated
pnpm --filter @repo/db db:generate

# Create/apply migrations against your local database
pnpm --filter @repo/db db:migrate

# Apply existing migrations without prompting (e.g. CI/production)
pnpm --filter @repo/db db:deploy
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

This runs the `dev` task through Turborepo, which is marked `persistent`/non-cached in `turbo.json`. By default Next.js will bind to `http://localhost:3000` and automatically pick the next free port (e.g. `3001`) for the second app — check your terminal output for the exact URLs.

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
  auth/                @repo/auth    Authentication logic (NextAuth)
  types/               @repo/types   Shared TypeScript types / zod schemas
  ui/                  @workspace/ui               Shared shadcn/ui component library
  eslint-config/       @workspace/eslint-config     Shared ESLint flat configs
  typescript-config/   @workspace/typescript-config Shared tsconfig base configs
```

## 10. Troubleshooting

- **`pnpm install` fails on engines check** — confirm `node -v` reports `20.x` or newer.
- **Prisma commands fail to connect** — confirm `DATABASE_URL` in `packages/database/.env` is correct and the database is reachable.
- **Type errors after pulling new changes** — run `pnpm --filter @repo/db db:generate` again; the Prisma client is generated code and is not committed to git.
- **Wrong pnpm version** — re-run `corepack prepare pnpm@10.33.4 --activate`; mismatched package managers can produce a different lockfile/hoisting layout.

See [`docs/instructions.md`](./instructions.md) for the coding standards to follow once your environment is set up.
