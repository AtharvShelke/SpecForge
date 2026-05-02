import { NextRequest, NextResponse } from "next/server";
import { testRules } from "@/services/compatibility.service";
import { ServiceError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await testRules(body.variantIds);
    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof ServiceError)
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    console.error("[POST_RULES_TEST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
