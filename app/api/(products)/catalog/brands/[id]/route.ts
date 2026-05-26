import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBrand } from "@/lib/adminSerializers";
import { ServiceError } from "@/lib/errors";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const brand = await prisma.brand.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json(serializeBrand(brand));
  } catch (error: any) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
