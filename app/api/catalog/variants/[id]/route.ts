import { NextResponse } from 'next/server';
import { CatalogService } from '@/lib/services/catalog.service';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const variant = await CatalogService.getVariantById(id);
    if (!variant) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(variant);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
