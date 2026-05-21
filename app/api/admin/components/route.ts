/**
 * Admin API for managing components (products).
 *
 * POST /api/admin/components — Create a new component
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      description,
      subCategoryId,
      brandId,
      status = "ACTIVE",
      sku,
      price,
      compareAtPrice,
      specs = [],
      images = [],
    } = body;

    if (!name || !subCategoryId || !sku || price === undefined) {
      return NextResponse.json(
        { error: "name, subCategoryId, sku, and price are required" },
        { status: 400 },
      );
    }

    // Verify subcategory exists
    const subCategory = await prisma.subCategory.findUnique({
      where: { id: subCategoryId },
    });
    if (!subCategory) {
      return NextResponse.json(
        { error: "SubCategory not found" },
        { status: 404 },
      );
    }

    // Create product with variant and specs in a transaction
    const product = await prisma.$transaction(async (tx) => {
      // Create product
      const newProduct = await tx.product.create({
        data: {
          name,
          description,
          subCategoryId,
          brandId: brandId || null,
          status: status as any,
          media: images.length > 0
            ? {
                create: images.map((url: string, idx: number) => ({
                  url,
                  sortOrder: idx,
                })),
              }
            : undefined,
        },
      });

      // Create variant
      const variant = await tx.productVariant.create({
        data: {
          productId: newProduct.id,
          sku,
          price,
          compareAtPrice: compareAtPrice || null,
          status: "IN_STOCK",
        },
      });

      // Create variant specs
      for (const spec of specs) {
        const specDef = await tx.specDefinition.findFirst({
          where: {
            subCategoryId,
            name: spec.specName,
          },
          include: { options: true },
        });

        if (!specDef) continue;

        const specData: any = {
          variantId: variant.id,
          specId: specDef.id,
        };

        // Find matching option or set raw value
        if (spec.optionValue) {
          const option = specDef.options.find(
            (o) => o.value === spec.optionValue,
          );
          if (option) specData.optionId = option.id;
        }

        if (spec.valueString !== undefined) specData.valueString = spec.valueString;
        if (spec.valueNumber !== undefined) specData.valueNumber = spec.valueNumber;
        if (spec.valueBool !== undefined) specData.valueBool = spec.valueBool;

        await tx.variantSpec.create({ data: specData });
      }

      return tx.product.findUnique({
        where: { id: newProduct.id },
        include: {
          brand: true,
          subCategory: true,
          media: true,
          variants: {
            include: {
              variantSpecs: { include: { spec: true, option: true } },
            },
          },
        },
      });
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    if (error instanceof ServiceError)
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    console.error("[POST_ADMIN_COMPONENTS]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
