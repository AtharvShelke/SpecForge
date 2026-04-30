import { NextResponse } from 'next/server';
import { CatalogService, ServiceError, createCategory } from '@/lib/services/catalog.service';
import { measureRoute } from '@/lib/performance';

export async function GET() {
  return measureRoute("GET /api/catalog/categories", async () => {
    try {
      const categories = await CatalogService.getCategories();
      return NextResponse.json(categories, {
        headers: {
          "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=1800",
        },
      });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const category = await createCategory(body);
    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    if (error instanceof ServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
