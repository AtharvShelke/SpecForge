/**
 * POST /api/build/validate
 *
 * Validates a build's compatibility without persisting the result using the in-memory engine.
 * Accepts either { buildId } to validate an existing build,
 * or { variantIds } to validate a set of products/variants directly.
 */

import { NextRequest, NextResponse } from "next/server";
import { getBuildById } from "@/services/build.service";
import { validateBuildSync } from "@/lib/compatibilityEngine";
import { ServiceError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Option A: validate an existing build by ID
    if (body.buildId) {
      const build = await getBuildById(body.buildId);
      const result = validateBuildSync(build.items);
      return NextResponse.json(result);
    }

    // Option B: validate a list of product/variant IDs (dry-run, no persist)
    if (body.variantIds && Array.isArray(body.variantIds)) {
      const products = await prisma.product.findMany({
        where: { id: { in: body.variantIds } },
        include: { specs: true }
      });
      const result = validateBuildSync(products);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: "Provide either 'buildId' or 'variantIds'" },
      { status: 400 },
    );
  } catch (error: any) {
    if (error instanceof ServiceError)
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    console.error("[POST_BUILD_VALIDATE]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
