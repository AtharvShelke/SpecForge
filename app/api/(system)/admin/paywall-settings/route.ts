import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/requireAdmin";

const paywallSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  price: z.number().min(0).optional(),
}).strict();

/**
 * GET /api/admin/paywall-settings
 * Returns the paywall configuration.
 */
export async function GET() {
  try {
    let settings = await prisma.paywallSettings.findUnique({
      where: { id: "paywall_config" },
    });

    // Create default if not exists
    if (!settings) {
      settings = await prisma.paywallSettings.create({
        data: {
          id: "paywall_config",
          enabled: false,
          price: 150,
        },
      });
    }

    return NextResponse.json({
      enabled: settings.enabled,
      price: Number(settings.price),
    });
  } catch (error) {
    console.error("Error fetching paywall settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch paywall settings" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/paywall-settings
 * Updates the paywall configuration.
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const body = await request.json();
    const validated = paywallSettingsSchema.parse(body);

    const settings = await prisma.paywallSettings.upsert({
      where: { id: "paywall_config" },
      create: {
        id: "paywall_config",
        enabled: validated.enabled ?? false,
        price: validated.price ?? 150,
      },
      update: {
        ...(validated.enabled !== undefined && { enabled: validated.enabled }),
        ...(validated.price !== undefined && { price: validated.price }),
      },
    });

    return NextResponse.json({
      enabled: settings.enabled,
      price: Number(settings.price),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 },
      );
    }
    console.error("Error updating paywall settings:", error);
    return NextResponse.json(
      { error: "Failed to update paywall settings" },
      { status: 500 },
    );
  }
}
