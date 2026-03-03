import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSupplierSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional().nullable(),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
});

// ── GET /api/suppliers/[id] ──────────────────────────────
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supplier = await prisma.supplier.findUnique({
            where: { id },
        });

        if (!supplier) {
            return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
        }

        return NextResponse.json(supplier);
    } catch (error) {
        console.error("GET /api/suppliers/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── PUT /api/suppliers/[id] ──────────────────────────────
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const data = updateSupplierSchema.parse(body);

        if (data.name) {
            const existing = await prisma.supplier.findUnique({ where: { name: data.name } });
            if (existing && existing.id !== id) {
                return NextResponse.json({ error: "Supplier name already exists" }, { status: 409 });
            }
        }

        const supplier = await prisma.supplier.update({
            where: { id },
            data,
        });

        return NextResponse.json(supplier);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("PUT /api/suppliers/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── DELETE /api/suppliers/[id] ───────────────────────────
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.supplier.delete({ where: { id } });
        return NextResponse.json({ message: "Supplier deleted" });
    } catch (error) {
        if ((error as any).code === "P2003") {
            return NextResponse.json(
                { error: "Cannot delete supplier with active purchase orders" },
                { status: 400 }
            );
        }
        console.error("DELETE /api/suppliers/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
