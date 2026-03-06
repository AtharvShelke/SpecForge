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
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);

        const where = search
            ? {
                OR: [
                    { name: { contains: search, mode: "insensitive" as const } },
                    { email: { contains: search, mode: "insensitive" as const } },
                ],
            }
            : undefined;

        const [suppliers, total] = await Promise.all([
            prisma.supplier.findMany({
                where,
                orderBy: { name: "asc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.supplier.count({ where }),
        ]);

        return NextResponse.json({ suppliers, total, page, limit });
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
