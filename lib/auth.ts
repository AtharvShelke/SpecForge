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
  hasPaidPaywall: boolean;
}

export type AuthenticatedUser = SessionUser;

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
      hasPaidPaywall: true,
    },
  });

  if (!user) return null;

  return user;
}

export async function authenticateRequest(req: Request): Promise<SessionUser | null> {
  let token: string | null = null;
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    token = authHeader.substring(7);
  }

  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get("token")?.value ?? null;
    } catch {
      // Cookies not accessible in this context
    }
  }

  if (!token) return null;

  const payload = await verifyToken(token);
  const userId = typeof payload?.userId === "string" ? payload.userId : null;
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      hasPaidPaywall: true,
    },
  });
}

export async function requireAdmin(req?: Request): Promise<SessionUser> {
  const user = req ? await authenticateRequest(req) : await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return user;
}
