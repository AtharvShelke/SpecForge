<<<<<<< HEAD
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

// Prevent this file from being bundled in the client
if (typeof window !== "undefined") {
  throw new Error("This module can only be used on the server side");
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  const payload = await verifyToken(token);
  const userId = typeof payload?.userId === "string" ? payload.userId : null;

  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (!user) return null;

  return user;
}
=======
import type { NextRequest } from "next/server";
import { ApiError } from "@/lib/security/errors";
import { prisma } from "./prisma";
import { verifyToken } from "./jwt";
import { SESSION_COOKIE_NAME } from "./session";

export type AppRole = "ADMIN" | "USER";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: AppRole;
}

type SessionPayload = {
  userId?: string;
  email?: string;
  name?: string;
  role?: AppRole;
};

function readCookie(req: Request | NextRequest, name: string) {
  if ("cookies" in req) {
    return req.cookies.get(name)?.value ?? null;
  }

  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) {
    return null;
  }

  for (const cookie of cookieHeader.split(";")) {
    const [key, ...rest] = cookie.trim().split("=");
    if (key === name) {
      return decodeURIComponent(rest.join("="));
    }
  }

  return null;
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: 2 * 60 * 60,
    path: "/",
  };
}

export function extractSessionToken(req: Request | NextRequest) {
  return readCookie(req, SESSION_COOKIE_NAME);
}

export async function authenticateRequest(
  req: Request | NextRequest
): Promise<AuthenticatedUser | null> {
  const token = extractSessionToken(req);
  if (!token) {
    return null;
  }

  const payload = await verifyToken<SessionPayload>(token);
  if (!payload?.userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!user) {
    return null;
  }

  return {
    ...user,
    role: user.role as AppRole,
  };
}

export async function requireAuth(
  req: Request | NextRequest
): Promise<AuthenticatedUser> {
  const user = await authenticateRequest(req);
  if (!user) {
    throw new ApiError(401, "Authentication required", "UNAUTHORIZED");
  }

  return user;
}

export async function requireRole(
  req: Request | NextRequest,
  roles: AppRole[]
): Promise<AuthenticatedUser> {
  const user = await requireAuth(req);
  if (!roles.includes(user.role)) {
    throw new ApiError(403, "Insufficient permissions", "FORBIDDEN");
  }

  return user;
}

export async function requireAdmin(
  req: Request | NextRequest
): Promise<AuthenticatedUser> {
  return requireRole(req, ["ADMIN"]);
}
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
