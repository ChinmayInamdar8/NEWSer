import path from "node:path"
import { fileURLToPath } from "node:url"

import { PrismaPg } from "@prisma/adapter-pg"
import { config as loadEnv } from "dotenv"

import { PrismaClient } from "../generated/prisma/client.js"

const here = path.dirname(fileURLToPath(import.meta.url))
// src/client.ts → ../.env; compiled dist/src/client.js → ../../.env
loadEnv({ path: path.resolve(here, "../.env") })
loadEnv({ path: path.resolve(here, "../../.env") })

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Add it to packages/database/.env"
  )
}

const adapter = new PrismaPg({
  connectionString,
})

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
