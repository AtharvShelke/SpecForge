import { NextResponse } from "next/server";
import { getBuilderSettings } from "@/lib/builderConfig";

/**
 * GET /api/builder-settings
 *
 * Public (unauthenticated) endpoint that returns the active BuilderSettings
 * for consumption by the storefront BuildContext.
 *
 * Response shape: BuilderSettings
 */
export async function GET() {
  try {
    const settings = await getBuilderSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("[builder-settings] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch builder settings" },
      { status: 500 },
    );
  }
}
