import { NextRequest, NextResponse } from "next/server";
import { listRules, createRule } from "@/lib/services/compatibility.service";
import { ServiceError } from "@/lib/services/catalog.service";

export async function GET() {
  try {
    const rules = await listRules();
    return NextResponse.json(rules);
  } catch (error: any) {
    if (error instanceof ServiceError) return new NextResponse(error.message, { status: error.statusCode });
    console.error("[GET_COMPATIBILITY_RULES]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rule = await createRule(body);
    return NextResponse.json(rule, { status: 201 });
  } catch (error: any) {
    if (error instanceof ServiceError) return new NextResponse(error.message, { status: error.statusCode });
    console.error("[POST_COMPATIBILITY_RULES]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
