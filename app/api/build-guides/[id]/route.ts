import { NextRequest, NextResponse } from "next/server";
import {
  deleteBuildGuide,
  getBuildGuideById,
  updateBuildGuide,
} from "@/services/build-guide.service";
import { ServiceError } from "@/lib/errors";
import { serializeBuildGuide } from "@/lib/adminSerializers";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
<<<<<<< HEAD
  try {
    const { id } = await params;
    const guide = await getBuildGuideById(id);
    return NextResponse.json(serializeBuildGuide(guide));
  } catch (error: unknown) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
=======
    try {
        const { id } = await params;
        const build = await prisma.buildGuide.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: { include: { specs: true, brand: true, media: true } },
                    },
                },
            },
        });

        if (!build) {
            return NextResponse.json({ error: "Build not found" }, { status: 404 });
        }

        return NextResponse.json(build);
    } catch (error) {
        console.error("GET /api/builds/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
<<<<<<< HEAD
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
=======
    try {
        const { id } = await params;
        const body = await req.json();

        // Basic validation
        if (!body.title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        // We can update title, description, category, total
        const updated = await prisma.buildGuide.update({
            where: { id },
            data: {
                title: body.title,
                description: body.description,
                category: body.category,
                total: body.total,
            }
        });

        // if items are provided, replace them
        if (body.items && Array.isArray(body.items)) {
            await prisma.buildGuideItem.deleteMany({ where: { buildGuideId: id } });
            await prisma.buildGuideItem.createMany({
                data: body.items.map((i: any) => ({
                    buildGuideId: id,
                    productId: i.productId || i.id, // handle both formats
                    quantity: i.quantity || 1,
                }))
            });
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error("PUT /api/builds/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
>>>>>>> dd4c02613217d0bf4ad2ee1f754233dd452b1b50
    }
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const guide = await updateBuildGuide(id, body);
    return NextResponse.json(serializeBuildGuide(guide));
  } catch (error: unknown) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await deleteBuildGuide(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
