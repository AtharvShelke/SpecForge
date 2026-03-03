import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSupplierSchema = z.object({
    name: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
});

// ── GET /api/suppliers ───────────────────────────────────
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search");

        const where = search
            ? {
                OR: [
                    { name: { contains: search, mode: "insensitive" as const } },
                    { email: { contains: search, mode: "insensitive" as const } },
                ],
            }
            : undefined;

        const suppliers = await prisma.supplier.findMany({
            where,
            orderBy: { name: "asc" },
        });

        return NextResponse.json(suppliers);
    } catch (error) {
        console.error("GET /api/suppliers error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── POST /api/suppliers ──────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const data = createSupplierSchema.parse(body);

        const supplier = await prisma.supplier.create({ data });
        return NextResponse.json(supplier, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        if ((error as any).code === "P2002") {
            return NextResponse.json({ error: "Supplier name already exists" }, { status: 409 });
        }
        console.error("POST /api/suppliers error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
