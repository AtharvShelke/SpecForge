import { NextRequest, NextResponse } from "next/server";
import {
  createReservation,
  getReservations,
} from "@/services/inventory.service";
import { ServiceError } from "@/services/catalog.service";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const reservations = await getReservations(
      searchParams.get("orderId") || undefined,
    );
    return NextResponse.json(reservations);
  } catch (error: any) {
    if (error instanceof ServiceError)
      return new NextResponse(error.message, { status: error.statusCode });
    console.error("[GET_RESERVATIONS]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const reservation = await createReservation(body);
    return NextResponse.json(reservation, { status: 201 });
  } catch (error: any) {
    if (error instanceof ServiceError)
      return new NextResponse(error.message, { status: error.statusCode });
    console.error("[POST_RESERVATIONS]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
