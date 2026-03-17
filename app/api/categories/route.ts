import { type NextRequest, NextResponse } from "next/server";
import { Category } from "@/generated/prisma/client";

// ── Computed once at module load time (not per-request) ──────────────
// Object.values on a const enum is a pure JS operation with zero I/O.
// There is no reason to recompute it on every request.
const CATEGORY_VALUES: string[] = Object.values(Category);

// ── Pre-serialized JSON string ────────────────────────────────────────
// NextResponse.json() calls JSON.stringify internally on every request.
// Since the payload is static, stringify it once and reuse the string.
const CATEGORY_JSON = JSON.stringify(CATEGORY_VALUES);

// ── Shared response headers ───────────────────────────────────────────
// - no-store is intentionally NOT used: this data is static and safe to cache.
// - s-maxage=3600: CDN/edge caches the response for 1 hour.
// - stale-while-revalidate=86400: serves stale instantly while refreshing
//   in the background. Enum values only change on a redeploy anyway.
const RESPONSE_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};

export async function GET(_req: NextRequest) {
  return new Response(CATEGORY_JSON, {
    status: 200,
    headers: RESPONSE_HEADERS,
  });
}

// Tell Next.js to render this route statically at build time.
// The handler will not spin up a serverless function at all for cached hits.
export const dynamic = "force-static";
export const revalidate = 3600; // ISR: regenerate at most once per hour