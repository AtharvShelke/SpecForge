import { NextRequest, NextResponse } from "next/server";
import { getBuildById, updateBuild } from "@/services/build.service";
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

    let build = await getBuildById(buildId);

    // Update name if provided
    if (name && name !== build.name) {
      await updateBuild(buildId, { name });
      build = await getBuildById(buildId);
    }

    // Calculate total price
    const totalPrice = build.items.reduce(
      (sum: number, item: any) => sum + Number(item.variant?.price ?? 0),
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
