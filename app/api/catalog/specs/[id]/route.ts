import { NextRequest, NextResponse } from "next/server";
import { deleteSpec, ServiceError, updateSpec } from "@/lib/services/catalog.service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const spec = await updateSpec(id, body);
    return NextResponse.json(spec);
  } catch (error: any) {
    const status = error instanceof ServiceError ? error.statusCode : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await deleteSpec(id);
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    const status = error instanceof ServiceError ? error.statusCode : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
