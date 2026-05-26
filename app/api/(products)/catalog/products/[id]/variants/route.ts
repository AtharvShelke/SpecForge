/**
 * Variants API — DEPRECATED
 *
 * ProductVariant model has been removed. Product-level attributes
 * are now stored via ProductSpec + CategoryAttribute.
 * These endpoints return empty/no-op responses for backwards compatibility.
 */

import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await params; // consume the param
  // Variants have been replaced by product-level specs
  return NextResponse.json([]);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await params;
  return NextResponse.json(
    { error: "Variants are no longer supported. Use product specs instead." },
    { status: 410 },
  );
}
