import { NextRequest, NextResponse } from "next/server";
import { checkBuildCompatibility } from "@/services/compatibility.service";
import { ServiceError } from "@/services/catalog.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await checkBuildCompatibility(body.buildId);
    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof ServiceError)
      return new NextResponse(error.message, { status: error.statusCode });
    console.error("[POST_COMPATIBILITY_CHECK]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
