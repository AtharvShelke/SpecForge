import { NextRequest } from 'next/server';
import { verifyToken } from './jwt';
import { prisma } from './prisma';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export async function authenticateRequest(req: NextRequest): Promise<AuthenticatedUser | null> {
  const token = req.cookies.get('token')?.value;

  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return null;
  }

  // Fetch fresh user data from database to get role
  const user = await prisma.user.findUnique({
    where: { id: payload.userId as string },
    select: { id: true, email: true, name: true, role: true }
  });

  if (!user) {
    return null;
  }

  return user;
}

export async function requireAuth(req: NextRequest): Promise<AuthenticatedUser> {
  const user = await authenticateRequest(req);
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

export async function requireAdmin(req: NextRequest): Promise<AuthenticatedUser> {
  const user = await requireAuth(req);
  
  if (user.role !== 'ADMIN') {
    throw new Error('Admin access required');
  }
  
  return user;
}
