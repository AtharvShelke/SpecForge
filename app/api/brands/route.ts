import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CategoryEnum = z.enum([
    "PROCESSOR", "GPU", "MOTHERBOARD", "RAM", "STORAGE",
    "PSU", "CABINET", "COOLER", "MONITOR", "PERIPHERAL", "NETWORKING", "LAPTOP",
]);

const createBrandSchema = z.object({
    name: z.string().min(1),
    categories: z.array(CategoryEnum).default([]),
});

// ── GET /api/brands ─────────────────────────────────────
export async function GET() {
    try {
        const brands = await prisma.brand.findMany({
            orderBy: { name: "asc" },
            include: { products: { select: { id: true } } },
        });
        return NextResponse.json(brands);
    } catch (error) {
        console.error("GET /api/brands error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── POST /api/brands ────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const data = createBrandSchema.parse(body);

        // Check unique name
        const existing = await prisma.brand.findUnique({ where: { name: data.name } });
        if (existing) {
            return NextResponse.json({ error: "Brand name already exists" }, { status: 409 });
        }

        const brand = await prisma.brand.create({
            data: { name: data.name, categories: data.categories },
        });

        return NextResponse.json(brand, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("POST /api/brands error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
