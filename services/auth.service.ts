// lib/services/auth.service.ts

import { ServiceError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new ServiceError("Invalid credentials", 401);

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new ServiceError("Invalid credentials", 401);

  return user;
}

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
}) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) throw new ServiceError("User already exists", 409);

  const hashed = await bcrypt.hash(data.password, 12);

  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashed,
    },
  });
}
