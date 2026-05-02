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
      { product: { name: { contains: params.search, mode: "insensitive" } } },
      { sku: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [variants, total] = await Promise.all([
    prisma.productVariant.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            subCategory: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        variantSpecs: {
          select: {
            spec: {
              select: {
                id: true,
                name: true,
              },
            },
            valueString: true,
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
    prisma.productVariant.count({ where }),
  ]);

  return {
    items: variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      price: Number(v.price),
      product: {
        id: v.product.id,
        name: v.product.name,
        subCategory: {
          id: v.product.subCategory.id,
          name: v.product.subCategory.name,
        },
      },
      variantSpecs: v.variantSpecs.map((vs) => ({
        spec: {
          id: vs.spec.id,
          name: vs.spec.name,
        },
        valueString: vs.valueString ?? undefined,
        valueNumber: vs.valueNumber !== null ? vs.valueNumber : undefined,
        option: vs.option ? { value: vs.option.value } : undefined,
      })),
    })),
    total,
  };
}
