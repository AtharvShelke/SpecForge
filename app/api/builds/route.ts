import { NextRequest, NextResponse } from "next/server";
import { createBuild, listBuilds } from "@/services/build.service";
import { ServiceError } from "@/services/catalog.service";

export async function GET() {
  try {
    const builds = await listBuilds();
    return NextResponse.json(builds);
  } catch (error: any) {
    if (error instanceof ServiceError)
      return new NextResponse(error.message, { status: error.statusCode });
    console.error("[GET_BUILDS]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const build = await createBuild(body);
    return NextResponse.json(build, { status: 201 });
  } catch (error: any) {
    if (error instanceof ServiceError)
      return new NextResponse(error.message, { status: error.statusCode });
    console.error("[POST_BUILDS]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
