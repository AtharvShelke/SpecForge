import { NextRequest, NextResponse } from "next/server";
import { updateInventoryItem } from "@/services/inventory.service";
import { ServiceError } from "@/lib/errors";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const item = await updateInventoryItem(id, body);
    return NextResponse.json(item);
  } catch (error: any) {
    if (error instanceof ServiceError)
      return new NextResponse(error.message, { status: error.statusCode });
    console.error("[PATCH_INVENTORY_ITEM_ID]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
