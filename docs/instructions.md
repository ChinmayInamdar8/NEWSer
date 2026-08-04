# Coding Standards & Turborepo Conventions

These are **strict, mandatory** rules for writing and organizing code in this repository. They exist so the monorepo stays fast to build, easy to reason about, and safe to refactor as it grows. Code reviews should block on violations of these rules.

## 1. Apps vs. Packages — strict boundaries

- `apps/*` are **deployable applications only** (currently `web` and `admin`, both Next.js). An app may contain routes, pages, app-specific composition, and thin glue code.
- `packages/*` are **shared, reusable code**: database access, auth, shared types, UI primitives, and tooling config.
- **Business/domain logic, database access, and cross-app types must never live inside `apps/*`.** If two apps need it, or it isn't view/routing code, it belongs in a package.
- Packages must **never** import from `apps/*`. Dependencies flow one way: `apps -> packages`.
- Packages must not reach into another package's internals. Only import through that package's declared public entry points (its `exports` map / package name) — never deep-import another package's `src` folder via a relative path like `../../auth/src/session`.

## 2. Package naming & manifest rules

- Every package under `packages/*` must declare `"private": true` unless it is explicitly meant to be published.
- Pick **one** npm scope for all new internal, non-publishable packages and use it consistently — this repo standardizes on `@repo/<name>` for domain packages (`@repo/db`, `@repo/auth`, `@repo/types`). Tooling/UI packages copied from the shadcn/turbo starter template use `@workspace/<name>` (`@workspace/ui`, `@workspace/eslint-config`, `@workspace/typescript-config`); do not introduce a third scope.
- The package folder name should match (or be an obvious relative of) the unscoped package name.
- Cross-package dependencies inside the workspace **must** use the `workspace:*` protocol (e.g. `"@repo/db": "workspace:*"`). Never pin an internal package to a semver range or install it from a registry.
- Define a package's public surface explicitly via the `exports` field in `package.json`. Don't rely on implicit `main`/root resolution for anything beyond the simplest single-entry package.

## 3. TypeScript rules

- Every package and app **must** have its own `tsconfig.json` that `extends` a shared base from `@workspace/typescript-config` (`base.json` for plain TS/Node packages, `react-library.json` for React component libraries). Never hand-roll `compilerOptions` from scratch.
- Never weaken the shared strictness settings (`strict`, `noUncheckedIndexedAccess`, etc.) in a package-level `tsconfig.json`. If a specific file needs an exception, scope it to that file, not the whole package.
- Avoid `any`. If it is unavoidable (e.g. bridging an untyped third-party API), narrow it to the smallest possible surface and give the variable/parameter an explicit type as soon as possible afterward.
- Module resolution is `NodeNext`. Relative imports within a package's `src` **must** include the explicit `.js` extension (even though the source file is `.ts`), matching the existing code in `packages/database/src` and `packages/auth/src`.
- Every package must expose a `"typecheck": "tsc --noEmit"` script so it participates in `pnpm typecheck` / `turbo typecheck`.

## 4. Turborepo pipeline rules

- Any script that should run repo-wide (`build`, `dev`, `lint`, `format`, `typecheck`, `db:*`, etc.) **must** have a matching task entry in the root `turbo.json`. A script that only exists in a package's `package.json` without a `turbo.json` task will not be cached or orchestrated correctly.
- Tasks that depend on their dependencies finishing first (build, typecheck) must declare `"dependsOn": ["^taskName"]`.
- Long-running or non-deterministic tasks (`dev`, database migrations) must be marked `"cache": false"`; persistent watchers (`dev`) must also set `"persistent": true`.
- Any environment variable read at build/runtime that affects output must be declared in `turbo.json` (`globalEnv` for shared vars, or a task-level `env`) so Turborepo's cache stays correct. Don't silence `turbo/no-undeclared-env-vars` lint warnings — fix the declaration instead.
- Prefer `pnpm --filter <package> <script>` for running a single workspace's task during development, and root-level `pnpm <script>` (which delegates to `turbo`) for anything that should fan out across the monorepo.

## 5. Dependency management

- Add a dependency to the **package/app that actually uses it**, not to the repo root. Only truly cross-cutting tooling (`turbo`, root `typescript`, `prettier`, root eslint bootstrapping) belongs in the root `package.json`.
- Never duplicate a dependency's version across packages by hand — let pnpm's workspace resolution hoist it. If two packages need incompatible versions, that is a signal to align on one version, not to fork it silently.
- Do not add a second lockfile or `pnpm-workspace.yaml` inside an app/package folder — there must be exactly one workspace root and one `pnpm-lock.yaml`, at the repository root.
- Run `pnpm install` only from the repo root.

## 6. Linting & formatting

- Every workspace's `eslint.config.*` must extend a shared config from `@workspace/eslint-config` (`base`, `next-js`, or `react-internal`) rather than defining rules from scratch. Add repo-wide rule changes in `packages/eslint-config`, not per-app overrides, unless the override is genuinely app-specific.
- All code must be formatted with the root Prettier config (`.prettierrc`): no semicolons, double quotes, 2-space indentation, `es5` trailing commas, 80-character print width, Tailwind class sorting via `prettier-plugin-tailwindcss`. Run `pnpm format` before opening a PR — do not hand-format against the grain of the config.
- Warnings surfaced via `eslint-plugin-only-warn` are downgraded so they don't fail CI, but they are **not optional** — treat every lint warning as a required fix before merging, not just errors.

## 7. Database (Prisma) rules

- Never hand-edit files under `packages/database/generated/` — it is generated by `prisma generate` and is git-ignored. If it looks wrong, fix `schema.prisma` and regenerate.
- All schema changes must go through `prisma migrate dev` so a migration file is captured under `packages/database/prisma/migrations/`. Never use `prisma db push` against a shared or production database.
- Access `DATABASE_URL` and the Prisma client only from `@repo/db`. Apps and other packages must import the shared `prisma` client from `@repo/db` rather than instantiating their own `PrismaClient`.

## 8. React / Next.js / UI rules

- Shared, reusable UI primitives (buttons, inputs, layout primitives, theme providers) belong in `@workspace/ui`. If a component is used — or will likely be used — by more than one app, it does not belong inside `apps/*`.
- Add new shadcn/ui components through the documented workflow (`pnpm dlx shadcn@latest add <component> -c apps/<app>`), which places generated files in `packages/ui/src/components`; do not hand-copy component code between apps.
- Import shared UI via its package subpath exports, e.g. `import { Button } from "@workspace/ui/components/button"`, never via a relative path that reaches into `packages/ui`.
- Each Next.js app's `eslint.config` should extend `@workspace/eslint-config/next-js`.

## 9. Environment variables & secrets

- Never commit `.env*` files — they are git-ignored at the root on purpose. Do not add exceptions for "just this one env file."
- A package/app that requires secrets should read them only within its own code (e.g. `DATABASE_URL` is only ever read inside `@repo/db`). Don't pass raw `process.env` lookups for another package's config across a package boundary — pass a typed value/config object instead.

## 10. Git & PR hygiene

- Never commit `node_modules/`, `.turbo/`, `packages/database/generated/`, build output (`dist/`, `.next/`), or any `.env*` file.
- Keep commits scoped to one logical change. If a change touches both a shared package and the apps that consume it, that's fine in one PR — but avoid unrelated, drive-by changes in the same commit.
- Before pushing, run the full verification suite from the repo root:

```bash
pnpm lint
pnpm typecheck
pnpm format
pnpm build
```

- If you add a new package, follow the [setup guide](./setup.md) conventions: give it a `tsconfig.json` extending the shared config, a `typecheck` script, and register any new cross-cutting scripts in `turbo.json`.
