import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const taxSettingsSchema = z.object({
  taxRatePct: z.number().min(0).max(100).optional(),
  taxName: z.string().optional(),
  taxDescription: z.string().nullable().optional(),
  enabled: z.boolean().optional(),
}).strict();

/**
 * GET /api/admin/tax-settings
 * Returns the tax configuration.
 */
export async function GET() {
  try {
    let settings = await prisma.taxSettings.findUnique({
      where: { id: "tax_config" },
    });

    // Create default if not exists
    if (!settings) {
      settings = await prisma.taxSettings.create({
        data: {
          id: "tax_config",
          taxRatePct: 18,
          taxName: "GST",
          taxDescription: null,
          enabled: true,
        },
      });
    }

    return NextResponse.json({
      taxRatePct: Number(settings.taxRatePct),
      taxName: settings.taxName,
      taxDescription: settings.taxDescription,
      enabled: settings.enabled,
    });
  } catch (error) {
    console.error("Error fetching tax settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch tax settings" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/tax-settings
 * Updates the tax configuration.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = taxSettingsSchema.parse(body);

    const settings = await prisma.taxSettings.upsert({
      where: { id: "tax_config" },
      create: {
        id: "tax_config",
        taxRatePct: validated.taxRatePct ?? 18,
        taxName: validated.taxName ?? "GST",
        taxDescription: validated.taxDescription,
        enabled: validated.enabled ?? true,
      },
      update: {
        ...(validated.taxRatePct !== undefined && { taxRatePct: validated.taxRatePct }),
        ...(validated.taxName !== undefined && { taxName: validated.taxName }),
        ...(validated.taxDescription !== undefined && { taxDescription: validated.taxDescription }),
        ...(validated.enabled !== undefined && { enabled: validated.enabled }),
      },
    });

    return NextResponse.json({
      taxRatePct: Number(settings.taxRatePct),
      taxName: settings.taxName,
      taxDescription: settings.taxDescription,
      enabled: settings.enabled,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 },
      );
    }
    console.error("Error updating tax settings:", error);
    return NextResponse.json(
      { error: "Failed to update tax settings" },
      { status: 500 },
    );
  }
}
