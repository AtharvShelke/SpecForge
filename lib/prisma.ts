import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma";

// Prevent this file from being bundled in the client
if (typeof window !== "undefined") {
  throw new Error("This module can only be used on the server side");
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const prismaClientSingleton = () => {
  const pool = new Pool({
    connectionString,
    // ── Pool sizing ───────────────────────────────────────────────
    // Serverless: each lambda has its own process, so keep max low
    // to avoid overwhelming Postgres with connections across instances.
    // For a long-running server, raise this to 10–20.
    // In dev, cap it at 4 to prevent exhausting Neon's 20-connection free tier.
    max: process.env.NODE_ENV === "production" ? 5 : 4,

    // ── Timeouts ──────────────────────────────────────────────────
    // Release idle connections quickly — critical in serverless where
    // the process may stay warm but idle between requests.
    idleTimeoutMillis: 10_000,

    // Increase timeout to 15 seconds to allow Neon compute containers
    // time to cold-start without throwing timeout connection errors.
    connectionTimeoutMillis: 15_000,

    // ── SSL ───────────────────────────────────────────────────────
    // rejectUnauthorized: false accepts self-signed certs (e.g. Supabase, RDS).
    // Set to true + supply a CA cert in production if your provider supports it.
    // In development, do not force ssl to false if connecting to a remote db (like Neon).
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : (connectionString.includes("localhost") || connectionString.includes("127.0.0.1")
            ? false
            : undefined),
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
          { emit: "event", level: "query" }, // subscribe below for timing
          { emit: "stdout", level: "warn" },
          { emit: "stdout", level: "error" },
        ]
        : [{ emit: "stdout", level: "error" }], // only errors in production
  });
};

// ── Global singleton ─────────────────────────────────────────────────
declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

export { prisma };
