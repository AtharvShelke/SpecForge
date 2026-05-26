/**
 * POST /api/build/validate
 *
 * Validates a build's compatibility without persisting the result.
 * Accepts either { buildId } to validate an existing build,
 * or { variantIds } to validate a set of variants directly.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  checkBuildCompatibility,
  testRules,
} from "@/services/compatibility.service";
import { ServiceError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Option A: validate an existing build by ID
    if (body.buildId) {
      const result = await checkBuildCompatibility(body.buildId);
      return NextResponse.json(result);
    }

    // Option B: validate a list of variant IDs (dry-run, no persist)
    if (body.variantIds && Array.isArray(body.variantIds)) {
      const result = await testRules(body.variantIds);
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
