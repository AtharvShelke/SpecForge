import { NextRequest, NextResponse } from "next/server";
import {
  getCategoryById,
  updateCategory,
  deleteCategory,
  
} from "@/services/catalog.service";
import { ServiceError } from "@/lib/errors";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const category = await getCategoryById(id);
    return NextResponse.json(category);
  } catch (error: any) {
    if (error instanceof ServiceError)
      return new NextResponse(error.message, { status: error.statusCode });
    console.error("[GET_CATEGORY_ID]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const category = await updateCategory(id, body);
    return NextResponse.json(category);
  } catch (error: any) {
    if (error instanceof ServiceError)
      return new NextResponse(error.message, { status: error.statusCode });
    console.error("[PATCH_CATEGORY_ID]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const category = await deleteCategory(id);
    return NextResponse.json(category);
  } catch (error: any) {
    if (error instanceof ServiceError)
      return new NextResponse(error.message, { status: error.statusCode });
    console.error("[DELETE_CATEGORY_ID]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
