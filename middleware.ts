import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { verifyToken } from "@/lib/jwt";
import { jsonError } from "@/lib/security/errors";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { assertTrustedOrigin } from "@/lib/security/request";

type MiddlewareTokenPayload = {
  userId?: string;
  role?: "ADMIN" | "USER";
};

function isUnsafeMethod(method: string) {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
}

function requiresAdminApi(pathname: string, method: string) {
  if (pathname === "/api/audit-logs") return true;
  if (pathname.startsWith("/api/inventory")) return true;
  if (pathname.startsWith("/api/invoices")) return true;
  if (pathname.startsWith("/api/payments")) return true;
  if (
    pathname.startsWith("/api/compatibility-rules") &&
    pathname !== "/api/compatibility-rules/public"
  ) {
    return true;
  }
  if (pathname === "/api/orders") {
    return method !== "POST";
  }
  if (pathname.startsWith("/api/orders/")) {
    if (pathname === "/api/orders/lookup") return false;
    if (pathname.includes("/invoice")) return false;
    return true;
  }
  if (pathname === "/api/categories") return method !== "GET";
  if (pathname === "/api/categories/hierarchy") return method !== "GET";
  if (pathname === "/api/categories/build-sequence") return method !== "GET";
  if (/^\/api\/categories\/[^/]+\/attributes$/.test(pathname)) {
    return method !== "GET";
  }
  if (pathname === "/api/brands") return method !== "GET";
  if (/^\/api\/brands\/[^/]+$/.test(pathname)) return method !== "GET";
  if (/^\/api\/products\/[^/]+$/.test(pathname)) return method !== "GET";
  if (/^\/api\/build-guides\/[^/]+$/.test(pathname)) return method !== "GET";

  return false;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi = pathname.startsWith("/api/") && requiresAdminApi(pathname, request.method);

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    if (isAdminApi) {
      return jsonError(401, "Authentication required", "UNAUTHORIZED");
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = await verifyToken<MiddlewareTokenPayload>(token);
  if (!payload?.userId) {
    const response = isAdminApi
      ? jsonError(401, "Authentication required", "UNAUTHORIZED")
      : NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  if (payload.role !== "ADMIN") {
    if (isAdminApi) {
      return jsonError(403, "Insufficient permissions", "FORBIDDEN");
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isAdminApi) {
    if (isUnsafeMethod(request.method)) {
      assertTrustedOrigin(request);
    }
    enforceRateLimit(request, "adminAction", payload.userId);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
