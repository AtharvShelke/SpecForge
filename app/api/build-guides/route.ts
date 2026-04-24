import { NextResponse } from "next/server";
import {
  createBuildGuide,
  listBuildGuides,
} from "@/lib/services/build-guide.service";
import { ServiceError } from "@/lib/services/catalog.service";
import {
  serializeBuildGuide,
  serializeBuildGuides,
} from "@/lib/api/adminSerializers";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const guides = await listBuildGuides();
    return NextResponse.json(serializeBuildGuides(guides));
  } catch (error: unknown) {
    if (error instanceof ServiceError) return new NextResponse(error.message, { status: error.statusCode });
    console.error("[GET_BUILD_GUIDES]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const guide = await createBuildGuide(body);
    return NextResponse.json(serializeBuildGuide(guide), { status: 201 });
  } catch (error: unknown) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    console.error("[POST_BUILD_GUIDES]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
