/**
 * Admin API for managing components (products).
 *
 * POST /api/admin/components — Create a new component
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/errors";
import { requireAdmin } from "@/lib/api/requireAdmin";

export async function POST(req: NextRequest) {
    
  try {
    const auth = await requireAdmin();
  
    if (auth.error) {
      return auth.error;
    }
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
    const subCategory = await prisma.subcategory.findUnique({
      where: { id: subCategoryId },
    });
    if (!subCategory) {
      return NextResponse.json(
        { error: "SubCategory not found" },
        { status: 404 },
      );
    }

    // Create product and specs in a transaction
    const product = await prisma.$transaction(async (tx) => {
      // Create product
      const newProduct = await tx.product.create({
        data: {
          name,
          description,
          categoryId: subCategory.categoryId,
          subcategoryId: subCategoryId,
          brandId: brandId || null,
          status: status as any,
          sku,
          price,
          compareAtPrice: compareAtPrice || null,
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

      // Create product specs
      for (const spec of specs) {
        const specDef = await tx.categoryAttribute.findFirst({
          where: {
            subcategoryId: subCategoryId,
            key: spec.specName,
          },
          include: { options: true },
        });

        if (!specDef) continue;

        const specData: any = {
          productId: newProduct.id,
          attributeId: specDef.id,
          value: spec.valueString || spec.optionValue || "",
        };

        // Find matching option or set raw value
        if (spec.optionValue) {
          const option = specDef.options.find(
            (o: { value: string; id: string }) => o.value === spec.optionValue,
          );
          if (option) specData.optionId = option.id;
        }

        if (spec.valueNumber !== undefined) specData.valueNumber = Number(spec.valueNumber);
        if (spec.valueBool !== undefined) specData.valueBoolean = spec.valueBool;

        await tx.productSpec.create({ data: specData });
      }

      return tx.product.findUnique({
        where: { id: newProduct.id },
        include: {
          brand: true,
          subcategory: true,
          media: true,
          specs: {
            include: { attribute: true, option: true },
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
