import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_BUILDER_SETTINGS } from '@/types';

/**
 * GET /api/admin/builder-config
 * Returns the global builder configuration. Creates default if none exists.
 */
export async function GET() {
  try {
    let config = await prisma.builderConfig.findUnique({
      where: { id: 'default' },
    });

    if (!config) {
      config = await prisma.builderConfig.create({
        data: {
          id: 'default',
          settings: DEFAULT_BUILDER_SETTINGS as any,
        },
      });
    }

    return NextResponse.json(config);
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

    // Merge with defaults to ensure all keys present
    const merged = { ...DEFAULT_BUILDER_SETTINGS, ...settings };

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
