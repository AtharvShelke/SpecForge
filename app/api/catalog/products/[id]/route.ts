import { NextResponse } from 'next/server';
import { CatalogService } from '@/lib/services/catalog.service';
import { serializeProduct } from '@/lib/api/adminSerializers';

function hasInventoryUnitFields(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const data = payload as Record<string, unknown>;
  return (
    "inventoryUnits" in data ||
    "serialNumber" in data ||
    "partNumber" in data
  );
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const product = await CatalogService.getProductById(id);
    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(serializeProduct(product));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    if (hasInventoryUnitFields(data)) {
      return NextResponse.json(
        {
          error:
            "serialNumber and partNumber are inventory-level fields. Use inventory APIs/pages to manage physical units.",
        },
        { status: 400 },
      );
    }
    const product = await CatalogService.updateProduct(id, data);
    return NextResponse.json(serializeProduct(product));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await CatalogService.deleteProduct(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
