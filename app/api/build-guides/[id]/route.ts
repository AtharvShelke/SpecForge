import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ── GET /api/build-guides/[id] ────────────────────────────────
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const build = await prisma.buildGuide.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        variant: { include: { product: { include: { specs: true, brand: true, media: true } } } },
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
    }
}

// ── PUT /api/build-guides/[id] ────────────────────────────────
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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
                    variantId: i.variantId || i.id, // handle both formats
                    quantity: i.quantity || 1,
                }))
            });
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error("PUT /api/builds/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── DELETE /api/build-guides/[id] ─────────────────────────────
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const existing = await prisma.buildGuide.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Build not found" }, { status: 404 });
        }

        await prisma.buildGuide.delete({ where: { id } });
        return NextResponse.json({ message: "Build deleted" });
    } catch (error) {
        console.error("DELETE /api/builds/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
