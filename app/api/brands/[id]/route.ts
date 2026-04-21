import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateBrandSchema = z.object({
    name: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
});

// ── GET /api/brands/[id] ────────────────────────────────
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const brand = await prisma.brand.findUnique({
            where: { id },
            include: { products: { select: { id: true, name: true, variants: { select: { sku: true } } } } },
        });
        if (!brand) {
            return NextResponse.json({ error: "Brand not found" }, { status: 404 });
        }
        return NextResponse.json(brand);
    } catch (error) {
        console.error("GET /api/brands/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── PUT /api/brands/[id] ────────────────────────────────
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const data = updateBrandSchema.parse(body);

        // Check unique constraints before attempting update
        if (data.name) {
            const existingName = await prisma.brand.findUnique({ where: { name: data.name } });
            if (existingName && existingName.id !== id) {
                return NextResponse.json({ error: "Brand name already exists" }, { status: 409 });
            }
        }
        if (data.slug) {
            const existingSlug = await prisma.brand.findUnique({ where: { slug: data.slug } });
            if (existingSlug && existingSlug.id !== id) {
                return NextResponse.json({ error: "Brand slug already exists" }, { status: 409 });
            }
        }

        const brand = await prisma.brand.update({
            where: { id },
            data,
        });

        return NextResponse.json(brand);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("PUT /api/brands/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── DELETE /api/brands/[id] ─────────────────────────────
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        // onDelete: SetNull — products will have brandId set to null
        await prisma.brand.delete({ where: { id } });
        return NextResponse.json({ message: "Brand deleted" });
    } catch (error) {
        console.error("DELETE /api/brands/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
