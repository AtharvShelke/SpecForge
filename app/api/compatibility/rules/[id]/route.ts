import { NextRequest, NextResponse } from "next/server";
import { getRuleById, updateRule, deleteRule } from "@/services/compatibility.service";
import { ServiceError } from "@/lib/errors";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const rule = await getRuleById(id);
    return NextResponse.json(rule);
  } catch (error: any) {
    if (error instanceof ServiceError)
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    console.error("[GET_RULE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const rule = await updateRule(id, body);
    return NextResponse.json(rule);
  } catch (error: any) {
    if (error instanceof ServiceError)
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    console.error("[PUT_RULE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await deleteRule(id);
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    if (error instanceof ServiceError)
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    console.error("[DELETE_RULE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
