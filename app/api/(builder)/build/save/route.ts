/**
 * POST /api/build/save
 *
 * Saves the current build configuration, optionally running compatibility check.
 * Accepts: { buildId, name?, runCheck? }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkBuildCompatibility } from "@/services/compatibility.service";
import { ServiceError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { buildId, name, runCheck = true } = body;

    if (!buildId) {
      return NextResponse.json(
        { error: "buildId is required" },
        { status: 400 },
      );
    }

    const build = await prisma.build.findUnique({
      where: { id: buildId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: { include: { media: true, subCategory: true } },
              },
            },
            slot: true,
          },
        },
      },
    });

    if (!build) {
      return NextResponse.json({ error: "Build not found" }, { status: 404 });
    }

    // Update name if provided
    if (name && name !== build.name) {
      await prisma.build.update({
        where: { id: buildId },
        data: { name },
      });
    }

    // Calculate total price
    const totalPrice = build.items.reduce(
      (sum, item) => sum + Number(item.variant?.price ?? 0),
      0,
    );

    // Run compatibility check if requested
    let compatibilityResult = null;
    if (runCheck && build.items.length >= 2) {
      compatibilityResult = await checkBuildCompatibility(buildId);
    }

    return NextResponse.json({
      build: {
        ...build,
        name: name || build.name,
      },
      totalPrice,
      compatibilityResult,
      itemCount: build.items.length,
    });
  } catch (error: any) {
    if (error instanceof ServiceError)
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    console.error("[POST_BUILD_SAVE]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
