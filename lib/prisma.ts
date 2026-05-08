import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const shouldUseSsl =
  process.env.DATABASE_SSL === "true" ||
  /sslmode=require/i.test(connectionString) ||
  /ssl=true/i.test(connectionString);

const prismaClientSingleton = () => {
  const pool = new Pool({
    connectionString,
    // ── Pool sizing ───────────────────────────────────────────────
    // Serverless: each lambda has its own process, so keep max low
    // to avoid overwhelming Postgres with connections across instances.
    // For a long-running server, raise this to 10–20.
    max: process.env.NODE_ENV === "production" ? 5 : 10,

    // ── Timeouts ──────────────────────────────────────────────────
    // Release idle connections quickly — critical in serverless where
    // the process may stay warm but idle between requests.
    idleTimeoutMillis: 10_000,

    // Fail fast if the pool is exhausted rather than queuing forever.
    connectionTimeoutMillis: 3_000,

    // ── SSL ───────────────────────────────────────────────────────
    // rejectUnauthorized: false accepts self-signed certs (e.g. Supabase, RDS).
    // Set to true + supply a CA cert in production if your provider supports it.
    ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
  });

  // Surface pool-level errors so they don't become silent failures
  pool.on("error", (err) => {
    console.error("[pg pool] Unexpected error on idle client:", err);
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? [
            { emit: "event", level: "query" },   // subscribe below for timing
            { emit: "stdout", level: "warn" },
            { emit: "stdout", level: "error" },
          ]
        : [{ emit: "stdout", level: "error" }],  // only errors in production
  });
};

// ── Dev-only query timing (zero overhead in production) ──────────────
// Logs slow queries so you can spot missing indexes early.
function attachDevLogging(client: PrismaClient) {
  // @ts-expect-error — $on is typed on the base client; events are valid at runtime
  client.$on("query", (e: { query: string; duration: number }) => {
    if (e.duration > 200) {
      console.warn(`[prisma] slow query (${e.duration}ms): ${e.query}`);
    }
  });
}

// ── Global singleton ─────────────────────────────────────────────────
declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
  attachDevLogging(prisma);
}

export { prisma };
