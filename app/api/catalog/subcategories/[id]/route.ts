import { NextResponse } from 'next/server';
import { updateSubCategory, ServiceError } from '@/lib/services/catalog.service';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updated = await updateSubCategory(params.id, body);
    return NextResponse.json(updated);
  } catch (error: any) {
    if (error instanceof ServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
