"use server";

import { prisma } from "@/lib/prisma";

export async function getSandboxVariants(params?: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const skip = (page - 1) * limit;

  const where: any = { deletedAt: null };

  if (params?.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { sku: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        subcategory: {
          select: {
            id: true,
            name: true,
          },
        },
        specs: {
          select: {
            attribute: {
              select: {
                id: true,
                label: true,
                key: true,
              },
            },
            value: true,
            valueNumber: true,
            option: {
              select: {
                value: true,
              },
            },
          },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items: products.map((v) => ({
      id: v.id,
      sku: v.sku,
      price: Number(v.price || 0),
      product: {
        id: v.id,
        name: v.name,
        subCategory: {
          id: String(v.subcategory?.id || ""),
          name: v.subcategory?.name || "",
        },
      },
      variantSpecs: v.specs.map((vs) => ({
        spec: {
          id: vs.attribute.id,
          name: vs.attribute.label || vs.attribute.key,
        },
        valueString: vs.value ?? undefined,
        valueNumber: vs.valueNumber !== null ? vs.valueNumber : undefined,
        option: vs.option ? { value: vs.option.value } : undefined,
      })),
    })),
    total,
  };
}
