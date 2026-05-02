import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_BUILDER_SETTINGS, BuilderSettings } from '@/types';
import { getBuilderSettings } from '@/lib/builderConfig';
import { z } from 'zod';

/** Runtime schema for BuilderSettings — validates incoming POST body. */
const BuilderSettingsSchema = z.object({
  defaultExpandedCategory: z.string().nullable().optional(),
  autoOpenNextCategory: z.boolean().optional(),
  enforceCompatibility: z.boolean().optional(),
  showWarnings: z.boolean().optional(),
  allowIncompatibleCheckout: z.boolean().optional(),
  powerCalculationMode: z
    .enum(['static', 'spec_based', 'rule_based'])
    .optional(),
  powerDefaults: z.object({
    baseWattage: z.number().min(0).optional(),
    cpuDefaultWattage: z.number().min(0).optional(),
    gpuDefaultWattage: z.number().min(0).optional(),
    ramWattagePerStick: z.number().min(0).optional(),
    storageWattagePerDrive: z.number().min(0).optional(),
  }).optional(),
  tdpBands: z.object({
    low: z.object({
      max: z.number().min(0).optional(),
      label: z.string().optional(),
    }).optional(),
    balanced: z.object({
      min: z.number().min(0).optional(),
      max: z.number().min(0).optional(),
      label: z.string().optional(),
    }).optional(),
    high: z.object({
      min: z.number().min(0).optional(),
      label: z.string().optional(),
    }).optional(),
  }).optional(),
  pricePresets: z.array(z.object({
    id: z.string().optional(),
    label: z.string().optional(),
    min: z.number().min(0).optional(),
    max: z.number().min(0).optional(),
  })).optional(),
}).strict(); // reject unknown keys

/**
 * GET /api/admin/builder-config
 * Returns the global builder configuration.
 * Delegates to getBuilderSettings() which handles the create-if-missing fallback.
 */
export async function GET() {
  try {
    const settings = await getBuilderSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('[builder-config] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch builder config' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/builder-config
 * Create or update the global builder configuration.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'settings (object) is required' },
        { status: 400 }
      );
    }

    // Runtime validation — rejects unknown or wrongly-typed fields
    const parsed = BuilderSettingsSchema.safeParse(settings);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid settings', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Merge validated partial with current defaults so all keys are always present
    const merged = { ...DEFAULT_BUILDER_SETTINGS, ...parsed.data };

    const config = await prisma.builderConfig.upsert({
      where: { id: 'default' },
      update: { settings: merged as any },
      create: { id: 'default', settings: merged as any },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('[builder-config] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save builder config' },
      { status: 500 }
    );
  }
}
