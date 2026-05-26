/**
 * Admin API for managing individual components.
 *
 * PUT /api/admin/components/:id — Update
 * DELETE /api/admin/components/:id — Soft delete
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ServiceError } from "@/lib/errors";
import { requireAdmin } from "@/lib/api/requireAdmin";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
    
  try {
    const auth = await requireAdmin();
  
    if (auth.error) {
      return auth.error;
    }
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Component not found" },
        { status: 404 },
      );
    }

    const {
      name,
      description,
      subCategoryId,
      brandId,
      status,
      sku,
      price,
      compareAtPrice,
      specs,
      images,
    } = body;

    const updated = await prisma.$transaction(async (tx) => {
      let categoryIdUpdate: number | undefined;
      if (subCategoryId !== undefined) {
        const subCat = await tx.subcategory.findUnique({
          where: { id: subCategoryId },
        });
        if (subCat) {
          categoryIdUpdate = subCat.categoryId;
        }
      }

      // Update product
      await tx.product.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(subCategoryId !== undefined && { subcategoryId: subCategoryId, categoryId: categoryIdUpdate }),
          ...(brandId !== undefined && { brandId }),
          ...(status !== undefined && { status: status as any }),
          ...(sku !== undefined && { sku }),
          ...(price !== undefined && { price }),
          ...(compareAtPrice !== undefined && { compareAtPrice }),
        },
      });

      // Update specs if provided
      if (specs && Array.isArray(specs)) {
        const subCatId = subCategoryId || existing.subcategoryId;

        // Delete existing product specs to refresh
        await tx.productSpec.deleteMany({ where: { productId: id } });

        for (const spec of specs) {
          const specDef = await tx.categoryAttribute.findFirst({
            where: { subcategoryId: subCatId, key: spec.specName },
            include: { options: true },
          });

          if (!specDef) continue;

          const specData: any = {
            productId: id,
            attributeId: specDef.id,
            value: spec.valueString || spec.optionValue || "",
          };

          if (spec.optionValue) {
            const option = specDef.options.find((o: { value: string; id: string }) => o.value === spec.optionValue);
            if (option) specData.optionId = option.id;
          }
          if (spec.valueNumber !== undefined) specData.valueNumber = Number(spec.valueNumber);
          if (spec.valueBool !== undefined) specData.valueBoolean = spec.valueBool;

          await tx.productSpec.create({
            data: specData,
          });
        }
      }

      // Update images if provided
      if (images && Array.isArray(images)) {
        await tx.productMedia.deleteMany({ where: { productId: id } });
        for (let i = 0; i < images.length; i++) {
          await tx.productMedia.create({
            data: {
              productId: id,
              url: images[i],
              sortOrder: i,
            },
          });
        }
      }

      return tx.product.findUnique({
        where: { id },
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

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error instanceof ServiceError)
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    console.error("[PUT_ADMIN_COMPONENT]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
    
  try {
    const auth = await requireAdmin();

  if (auth.error) {
    return auth.error;
  }
    const { id } = await params;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Component not found" },
        { status: 404 },
      );
    }

    // Soft delete
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), status: "ARCHIVED" },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error("[DELETE_ADMIN_COMPONENT]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
