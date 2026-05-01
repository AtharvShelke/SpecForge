/**
 * customer.service.ts — Business logic for Customer CRUD.
 */

import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/errors";

export async function listCustomers(filters?: { email?: string }) {
  const where: any = {};
  if (filters?.email) {
    where.email = { contains: filters.email, mode: "insensitive" };
  }

  return prisma.customer.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

export async function getCustomerById(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { orders: true, invoices: true },
  });
  if (!customer) throw new ServiceError("Customer not found", 404);
  return customer;
}

export async function createCustomer(data: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}) {
  if (!data.name || !data.email)
    throw new ServiceError("Name and email are required");

  const existing = await prisma.customer.findFirst({
    where: { email: data.email },
  });
  if (existing)
    throw new ServiceError("Customer with this email already exists", 409);

  return prisma.customer.create({ data });
}

export async function updateCustomer(
  id: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    addressLine1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  },
) {
  try {
    return await prisma.customer.update({ where: { id }, data });
  } catch (err: any) {
    if (err.code === "P2025") throw new ServiceError("Customer not found", 404);
    throw err;
  }
}
