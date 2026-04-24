import { NextResponse } from 'next/server';
import { CatalogService, ServiceError } from '@/lib/services/catalog.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subCategoryId = searchParams.get('subCategoryId');
    const specs = await CatalogService.getSpecs(subCategoryId || undefined);
    return NextResponse.json(specs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const spec = await CatalogService.createSpec(data);
    return NextResponse.json(spec, { status: 201 });
  } catch (error: any) {
    const status = error instanceof ServiceError ? error.statusCode : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
