import { NextResponse } from 'next/server';
import { CatalogService } from '@/lib/services/catalog.service';
import { serializeProduct, serializeProducts } from '@/lib/api/adminSerializers';

export async function GET(request: Request) {
  try {
    const products = await CatalogService.getProducts();
    return NextResponse.json(serializeProducts(products as any[]));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const product = await CatalogService.createProduct(data);
    return NextResponse.json(serializeProduct(product), { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
