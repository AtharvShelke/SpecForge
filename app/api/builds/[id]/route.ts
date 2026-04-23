import { NextRequest, NextResponse } from "next/server";
import { getBuildById, deleteBuild } from "@/lib/services/build.service";
import { ServiceError } from "@/lib/services/catalog.service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const build = await getBuildById(id);
    return NextResponse.json(build);
  } catch (error: any) {
    if (error instanceof ServiceError) return new NextResponse(error.message, { status: error.statusCode });
    console.error("[GET_BUILD_ID]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteBuild(id);
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    if (error instanceof ServiceError) return new NextResponse(error.message, { status: error.statusCode });
    console.error("[DELETE_BUILD]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
