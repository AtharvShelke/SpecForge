import { NextRequest, NextResponse } from "next/server";
import { listScopes, createScope } from "@/services/compatibility.service";
import { ServiceError } from "@/services/catalog.service";

export async function GET() {
  try {
    const scopes = await listScopes();
    return NextResponse.json(scopes);
  } catch (error: any) {
    if (error instanceof ServiceError)
      return new NextResponse(error.message, { status: error.statusCode });
    console.error("[GET_COMPATIBILITY_SCOPES]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const scope = await createScope(body);
    return NextResponse.json(scope, { status: 201 });
  } catch (error: any) {
    if (error instanceof ServiceError)
      return new NextResponse(error.message, { status: error.statusCode });
    console.error("[POST_COMPATIBILITY_SCOPES]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
