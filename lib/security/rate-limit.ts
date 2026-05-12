import { NextResponse } from "next/server";
import { ApiError } from "@/lib/security/errors";

type RateLimitBucket =
  | "login"
  | "register"
  | "orderPlacement"
  | "orderLookup"
  | "invoiceAccess"
  | "upload"
  | "adminAction";

type RateLimitConfig = {
  max: number;
  windowMs: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  key: string;
  limit: number;
  remaining: number;
  resetAt: number;
};

const RATE_LIMIT_CONFIG: Record<RateLimitBucket, RateLimitConfig> = {
  login: { max: 5, windowMs: 10 * 60 * 1000 },
  register: { max: 5, windowMs: 30 * 60 * 1000 },
  orderPlacement: { max: 15, windowMs: 10 * 60 * 1000 },
  orderLookup: { max: 20, windowMs: 10 * 60 * 1000 },
  invoiceAccess: { max: 20, windowMs: 10 * 60 * 1000 },
  upload: { max: 20, windowMs: 10 * 60 * 1000 },
  adminAction: { max: 120, windowMs: 10 * 60 * 1000 },
};

declare global {
  // eslint-disable-next-line no-var
  var __specforgeRateLimitStore: Map<string, RateLimitEntry> | undefined;
}

const store = globalThis.__specforgeRateLimitStore ?? new Map<string, RateLimitEntry>();
if (!globalThis.__specforgeRateLimitStore) {
  globalThis.__specforgeRateLimitStore = store;
}

export function getClientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

function getRateLimitKey(req: Request, bucket: RateLimitBucket, suffix?: string) {
  const ip = getClientIp(req);
  return [bucket, ip, suffix ?? ""].join(":");
}

export function enforceRateLimit(
  req: Request,
  bucket: RateLimitBucket,
  suffix?: string
): RateLimitResult {
  const config = RATE_LIMIT_CONFIG[bucket];
  const key = getRateLimitKey(req, bucket, suffix);
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    const fresh = { count: 1, resetAt: now + config.windowMs };
    store.set(key, fresh);
    return {
      key,
      limit: config.max,
      remaining: Math.max(0, config.max - fresh.count),
      resetAt: fresh.resetAt,
    };
  }

  existing.count += 1;
  store.set(key, existing);

  if (existing.count > config.max) {
    throw new ApiError(429, "Too many requests", "RATE_LIMITED", {
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    });
  }

  return {
    key,
    limit: config.max,
    remaining: Math.max(0, config.max - existing.count),
    resetAt: existing.resetAt,
  };
}

export function withRateLimitHeaders(
  response: NextResponse,
  rateLimit: RateLimitResult
) {
  response.headers.set("X-RateLimit-Limit", String(rateLimit.limit));
  response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
  response.headers.set(
    "X-RateLimit-Reset",
    String(Math.floor(rateLimit.resetAt / 1000))
  );
  return response;
}
