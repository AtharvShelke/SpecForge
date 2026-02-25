import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CategoryEnum = z.enum([
    "PROCESSOR", "GPU", "MOTHERBOARD", "RAM", "STORAGE",
    "PSU", "CABINET", "COOLER", "MONITOR", "PERIPHERAL", "NETWORKING",
]);

const updateBrandSchema = z.object({
    name: z.string().min(1).optional(),
    categories: z.array(CategoryEnum).optional(),
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
            include: { products: { select: { id: true, name: true, sku: true } } },
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

        // Check unique name if changing
        if (data.name) {
            const existing = await prisma.brand.findUnique({ where: { name: data.name } });
            if (existing && existing.id !== id) {
                return NextResponse.json({ error: "Brand name already exists" }, { status: 409 });
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
