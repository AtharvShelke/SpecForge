/**
 * Admin API for managing compatibility rules.
 *
 * GET /api/admin/rules — List all rules
 * POST /api/admin/rules — Create a new rule
 */

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { listRules, createRule } from "@/services/compatibility.service";
import { ServiceError } from "@/lib/errors";

export async function GET() {
  try {
    const rules = await listRules();
    return NextResponse.json(rules);
  } catch (error: any) {
    if (error instanceof ServiceError)
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    console.error("[GET_ADMIN_RULES]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rule = await createRule(body);
    return NextResponse.json(rule, { status: 201 });
  } catch (error: any) {
    if (error instanceof ServiceError)
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    console.error("[POST_ADMIN_RULES]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
