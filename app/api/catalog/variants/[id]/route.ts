import { NextRequest, NextResponse } from "next/server";
import { updateVariant } from "@/services/catalog.service";
import { ServiceError } from "@/lib/errors";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const variant = await updateVariant(id, body);
    return NextResponse.json(variant);
  } catch (error: any) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to update variant.",
      },
      { status: 500 },
    );
  }
}
