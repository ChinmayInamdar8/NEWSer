#!/usr/bin/env node
/**
 * One-command project bootstrap for NEWSer.
 *
 * Usage (from repo root):
 *   pnpm run setup
 *
 * Note: `pnpm setup` is a pnpm built-in (PATH install). Always use `pnpm run setup`.
 *
 * Order is intentional:
 *   1) ensure / validate env files
 *   2) pnpm install
 *   3) check database connection
 *   4) apply migrations
 *   5) generate Prisma client
 */

import { spawn } from "node:child_process"
import { createRequire } from "node:module"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")

const WORKSPACES = [
  { dir: ".", label: "root" },
  { dir: "apps/web", label: "web" },
  { dir: "apps/admin", label: "admin" },
  { dir: "apps/server", label: "server" },
  { dir: "packages/database", label: "database", required: ["DATABASE_URL"] },
  { dir: "packages/auth", label: "auth" },
  { dir: "packages/ui", label: "ui" },
  { dir: "packages/types", label: "types" },
  { dir: "packages/eslint-config", label: "eslint-config" },
  { dir: "packages/typescript-config", label: "typescript-config" },
]

const PLACEHOLDER_RE =
  /USER:PASSWORD|HOST:PORT|DATABASE_NAME|replace-with-a-long-random-string|changeme/i

const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function step(title) {
  console.log()
  log(`▸ ${title}`, colors.cyan + colors.bold)
}

function ok(message) {
  log(`  ✓ ${message}`, colors.green)
}

function warn(message) {
  log(`  ! ${message}`, colors.yellow)
}

function fail(message) {
  log(`  ✗ ${message}`, colors.red)
}

function resolvePath(...parts) {
  return path.join(ROOT, ...parts)
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}

  const env = {}
  const content = fs.readFileSync(filePath, "utf8")

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue

    const eq = line.indexOf("=")
    if (eq === -1) continue

    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    env[key] = value
  }

  return env
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      stdio: "inherit",
      shell: true,
      env: process.env,
      ...options,
    })

    child.on("error", reject)
    child.on("exit", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`Command failed (${code}): ${command} ${args.join(" ")}`))
    })
  })
}

function ensureEnvFiles() {
  step("Checking environment files")

  for (const workspace of WORKSPACES) {
    const dir = resolvePath(workspace.dir)
    const examplePath = path.join(dir, "example.env")
    const envPath = path.join(dir, ".env")

    if (!fs.existsSync(examplePath)) {
      warn(`${workspace.label}: no example.env (skipped)`)
      continue
    }

    if (fs.existsSync(envPath)) {
      ok(`${workspace.label}: .env already exists`)
      continue
    }

    fs.copyFileSync(examplePath, envPath)
    warn(`${workspace.label}: created .env from example.env — fill in real values`)
  }
}

function validateEnvs() {
  step("Validating required environment variables")

  const errors = []

  for (const workspace of WORKSPACES) {
    const required = workspace.required ?? []
    if (required.length === 0) continue

    const envPath = resolvePath(workspace.dir, ".env")
    const env = parseEnvFile(envPath)

    for (const key of required) {
      const value = env[key]?.trim()

      if (!value) {
        errors.push(`${workspace.label}: missing ${key} in ${path.relative(ROOT, envPath)}`)
        continue
      }

      if (PLACEHOLDER_RE.test(value)) {
        errors.push(
          `${workspace.label}: ${key} still looks like a placeholder in ${path.relative(ROOT, envPath)}`
        )
      }
    }
  }

  if (errors.length > 0) {
    for (const error of errors) fail(error)
    throw new Error(
      "Fix the env files above, then re-run: pnpm run setup\n" +
        "At minimum set a real DATABASE_URL in packages/database/.env"
    )
  }

  ok("Required environment variables look valid")
}

async function installDependencies() {
  step("Installing dependencies (pnpm install)")
  await run("pnpm", ["install"])
  ok("Dependencies installed")
}

async function checkDatabaseConnection() {
  step("Checking database connection")

  const envPath = resolvePath("packages/database/.env")
  const env = parseEnvFile(envPath)
  const databaseUrl = env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing from packages/database/.env")
  }

  // Make DATABASE_URL available to Prisma child processes.
  process.env.DATABASE_URL = databaseUrl

  const require = createRequire(resolvePath("packages/database/package.json"))
  const { Client } = require("pg")
  const client = new Client({ connectionString: databaseUrl })

  try {
    await client.connect()
    await client.query("SELECT 1")
    ok("Database connection successful")
  } catch (error) {
    fail("Could not connect to Postgres with DATABASE_URL")
    throw error
  } finally {
    await client.end().catch(() => {})
  }
}

async function runMigrations() {
  step("Applying database migrations")
  await run("pnpm", ["--filter", "@workspace/db", "db:deploy"])
  ok("Migrations applied")
}

async function generatePrismaClient() {
  step("Generating Prisma client")
  await run("pnpm", ["--filter", "@workspace/db", "db:generate"])
  ok("Prisma client generated")
}

async function main() {
  log("NEWSer setup", colors.bold)
  log(`Root: ${ROOT}`, colors.dim)

  ensureEnvFiles()
  validateEnvs()
  await installDependencies()
  await checkDatabaseConnection()
  await runMigrations()
  await generatePrismaClient()

  console.log()
  log("Setup complete.", colors.green + colors.bold)
  log("Next: pnpm dev", colors.dim)
  console.log()
}

main().catch((error) => {
  console.log()
  fail(error instanceof Error ? error.message : String(error))
  console.log()
  process.exit(1)
})
