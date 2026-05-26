import type { NextRequest } from "next/server";
import type { AuthenticatedUser } from "@/lib/auth";
import { getAllowedOrigins, getBaseUrl } from "@/lib/env";
import { ApiError } from "@/lib/security/errors";
import { getClientIp } from "@/lib/security/rate-limit";

function getRequestHost(req: Request) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const protocol = req.headers.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return null;
  }

  return `${protocol}://${host}`;
}

function getCurrentOrigin(req: Request) {
  if ("nextUrl" in req) {
    return (req as NextRequest).nextUrl.origin;
  }

  return getRequestHost(req);
}

export function assertTrustedOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) {
    return;
  }

  const allowed = new Set<string>();
  const currentOrigin = getCurrentOrigin(req);
  if (currentOrigin) {
    allowed.add(currentOrigin);
  }

  const baseUrl = getBaseUrl();
  if (baseUrl) {
    allowed.add(baseUrl);
  }

  for (const configured of getAllowedOrigins()) {
    allowed.add(configured);
  }

  if (!allowed.has(origin)) {
    throw new ApiError(403, "Invalid request origin", "INVALID_ORIGIN");
  }
}

export function buildAuditContext(
  req: Request,
  user: AuthenticatedUser | null,
  metadata?: Record<string, unknown>
) {
  const ipAddress = getClientIp(req);
  const userAgent = req.headers.get("user-agent") || null;
  const actor = user ? user.email : "Anonymous";
  const origin = req.headers.get("origin");

  return {
    actor,
    ipAddress,
    userAgent,
    metadata: {
      path:
        "nextUrl" in req
          ? (req as NextRequest).nextUrl.pathname
          : new URL(req.url).pathname,
      method: req.method,
      origin,
      userId: user?.id ?? null,
      role: user?.role ?? null,
      requestId: req.headers.get("x-request-id") ?? crypto.randomUUID(),
      ...(metadata ?? {}),
    },
  };
}
