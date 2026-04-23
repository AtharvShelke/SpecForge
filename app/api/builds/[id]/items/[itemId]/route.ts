import { NextRequest, NextResponse } from "next/server";
import { removeBuildItem } from "@/lib/services/build.service";
import { ServiceError } from "@/lib/services/catalog.service";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  try {
    const { id, itemId } = await params;
    await removeBuildItem(id, itemId);
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    if (error instanceof ServiceError) return new NextResponse(error.message, { status: error.statusCode });
    console.error("[DELETE_BUILD_ITEM]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
