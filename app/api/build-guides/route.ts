import { NextResponse } from "next/server";
import { listBuildGuides } from "@/lib/services/build-guide.service";
import { ServiceError } from "@/lib/services/catalog.service";
import { serializeBuildGuides } from "@/lib/api/adminSerializers";

export async function GET() {
  try {
    const guides = await listBuildGuides();
    return NextResponse.json(serializeBuildGuides(guides as any[]));
  } catch (error: any) {
    if (error instanceof ServiceError) return new NextResponse(error.message, { status: error.statusCode });
    console.error("[GET_BUILD_GUIDES]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
