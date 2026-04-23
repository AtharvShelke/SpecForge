import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// This is an additional endpoint to get the specs directly for a variant
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const variantSpecs = await prisma.variantSpec.findMany({
      where: { variantId: id },
      include: {
        spec: true,
        option: true,
      },
    });
    return NextResponse.json(variantSpecs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
