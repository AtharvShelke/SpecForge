import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createCustomerSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    company: z.string().optional(),
    addressLine1: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
});

// ── GET /api/customers ──────────────────────────────────
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
                    { company: { contains: search, mode: "insensitive" as const } },
                ],
            }
            : undefined;

        const [customers, total] = await Promise.all([
            prisma.customer.findMany({
                where,
                orderBy: { name: "asc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.customer.count({ where }),
        ]);

        return NextResponse.json({ customers, total, page, limit });
    } catch (error) {
        console.error("GET /api/customers error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── POST /api/customers ─────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const data = createCustomerSchema.parse(body);

        const customer = await prisma.customer.create({ data });
        return NextResponse.json(customer, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("POST /api/customers error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
