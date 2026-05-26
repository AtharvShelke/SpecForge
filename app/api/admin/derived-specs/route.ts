import { NextResponse } from "next/server";
import {
  createDerivedSpec,
  listDerivedSpecs,
} from "@/services/derivedSpec.service";
import { ServiceError } from "@/lib/errors";
import { serializeDerivedSpecs, serializeDerivedSpec } from "@/lib/adminSerializers";
import { getSessionUser } from "@/lib/auth";
import { requireAdmin } from "@/lib/api/requireAdmin";

export async function GET() {
  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return auth.error;
    }
    const specs = await listDerivedSpecs();
    return NextResponse.json(serializeDerivedSpecs(specs));
  } catch (error: unknown) {
    if (error instanceof ServiceError)
      return new NextResponse(error.message, { status: error.statusCode });
    console.error("[GET_DERIVED_SPECS]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return auth.error;
    }
    const body = await request.json();
    const spec = await createDerivedSpec(body);
    return NextResponse.json(serializeDerivedSpec(spec), { status: 201 });
  } catch (error: unknown) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    console.error("[POST_DERIVED_SPECS]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
