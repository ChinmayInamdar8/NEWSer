import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { compiledEnv } from "./compiled-env";

export const serverEnv: Record<string, string> = { ...compiledEnv };

function parseEnvFile(contents: string): Record<string, string> {
  const parsed: Record<string, string> = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    parsed[key] = value;
  }

  return parsed;
}

function envCandidates(): string[] {
  const files: string[] = [];
  const starts = [process.cwd()];

  if (typeof __dirname === "string" && __dirname.length > 0) {
    starts.push(__dirname);
  }

  for (const start of starts) {
    let dir = start;
    for (let i = 0; i < 8; i++) {
      files.push(resolve(dir, ".env"));
      files.push(resolve(dir, "apps/server/.env"));
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }

  return [...new Set(files)];
}

export function loadServerEnv(): Record<string, string> {
  Object.assign(serverEnv, compiledEnv);

  for (const file of envCandidates()) {
    try {
      Object.assign(serverEnv, parseEnvFile(readFileSync(file, "utf8")));
    } catch {
      // File is missing; try the next candidate.
    }
  }

  for (const [key, value] of Object.entries(serverEnv)) {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }

  return serverEnv;
}

loadServerEnv();
