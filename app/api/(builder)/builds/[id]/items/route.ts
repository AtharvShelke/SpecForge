import { NextRequest, NextResponse } from "next/server";
import { addBuildItem } from "@/services/build.service";
import { ServiceError } from "@/lib/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const buildItem = await addBuildItem(id, body);
    return NextResponse.json(buildItem, { status: 201 });
  } catch (error: any) {
    if (error instanceof ServiceError)
      return new NextResponse(error.message, { status: error.statusCode });
    console.error("[POST_BUILD_ITEMS]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
