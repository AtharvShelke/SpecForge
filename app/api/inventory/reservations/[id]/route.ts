import { NextRequest, NextResponse } from "next/server";
import { updateReservation } from "@/services/inventory.service";
import { ServiceError } from "@/services/catalog.service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const reservation = await updateReservation(id, body);
    return NextResponse.json(reservation);
  } catch (error: any) {
    if (error instanceof ServiceError)
      return new NextResponse(error.message, { status: error.statusCode });
    console.error("[PATCH_RESERVATION_ID]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
