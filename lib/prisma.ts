import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const shouldUseSsl =
  process.env.DATABASE_SSL === "true" ||
  /sslmode=(require|verify-full)/i.test(connectionString) ||
  /ssl=true/i.test(connectionString);

function formatQuery(query: string) {
  return query
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
}

const prismaClientSingleton = () => {
  const pool = new Pool({
    connectionString,
    max: process.env.NODE_ENV === "production" ? 5 : 10,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 3_000,
    ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
  });

  pool.on("error", (err) => {
    console.error("[pg pool]", err);
  });

  const adapter = new PrismaPg(pool);

  const prisma = new PrismaClient({
    adapter,

    log:
      process.env.NODE_ENV === "development"
        ? [
            { emit: "event", level: "query" },
            { emit: "stdout", level: "warn" },
            { emit: "stdout", level: "error" },
          ]
        : [{ emit: "stdout", level: "error" }],
  });

  // DEV QUERY LOGGER
  // if (process.env.NODE_ENV === "development") {
  //   prisma.$on("query", (e) => {
  //     // Ignore ultra-fast noise
  //     if (e.duration < 100) return;

  //     // Ignore Prisma heartbeat / metadata queries
  //     if (
  //       e.query.includes("__prisma_migrations") ||
  //       e.query.includes("pg_catalog")
  //     ) {
  //       return;
  //     }

  //     const duration =
  //       e.duration > 1000
  //         ? `${(e.duration / 1000).toFixed(2)}s`
  //         : `${e.duration}ms`;

  //     console.warn(
  //       `[prisma:${duration}] ${formatQuery(e.query)}`
  //     );
  //   });
  // }

  return prisma;
};

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma =
  globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}