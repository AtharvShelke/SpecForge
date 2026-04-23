import { NextResponse } from 'next/server';
import { CatalogService } from '@/lib/services/catalog.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const specId = searchParams.get('specId');
    if (!specId) return NextResponse.json({ error: 'specId required' }, { status: 400 });
    
    const options = await CatalogService.getSpecOptions(specId);
    return NextResponse.json(options);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
