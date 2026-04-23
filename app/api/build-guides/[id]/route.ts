import { NextRequest, NextResponse } from "next/server";
import {
  deleteBuildGuide,
  getBuildGuideById,
  updateBuildGuide,
} from "@/lib/services/build-guide.service";
import { ServiceError } from "@/lib/services/catalog.service";
import { serializeBuildGuide } from "@/lib/api/adminSerializers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const guide = await getBuildGuideById(id);
    return NextResponse.json(serializeBuildGuide(guide));
  } catch (error: any) {
    if (error instanceof ServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const guide = await updateBuildGuide(id, body);
    return NextResponse.json(serializeBuildGuide(guide));
  } catch (error: any) {
    if (error instanceof ServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await deleteBuildGuide(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error instanceof ServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
