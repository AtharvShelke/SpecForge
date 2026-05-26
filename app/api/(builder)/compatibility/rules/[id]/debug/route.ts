import { NextRequest, NextResponse } from "next/server";
import { debugRule } from "@/services/compatibility.service";
import { ServiceError } from "@/lib/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const result = await debugRule(id, body.variantIds || []);
    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof ServiceError)
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    console.error("[POST_RULE_DEBUG]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
