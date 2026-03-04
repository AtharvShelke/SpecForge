import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const buildItemSchema = z.object({
    productId: z.string().min(1),
    variantId: z.string().min(1),
    quantity: z.number().int().positive().default(1),
});

const createBuildSchema = z.object({
    name: z.string().min(1),
    total: z.number().min(0),
    items: z.array(buildItemSchema).min(1),
});

// ── GET /api/builds ─────────────────────────────────────
export async function GET() {
    try {
        const builds = await prisma.savedBuild.findMany({
            include: {
                items: {
                    include: {
                        variant: { include: { product: { include: { specs: true, brand: true } } } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(builds);
    } catch (error) {
        console.error("GET /api/builds error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── POST /api/builds ────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const data = createBuildSchema.parse(body);

        // Verify all products/variants exist
        const variantIds = data.items.map((i) => i.variantId);
        const variants = await prisma.productVariant.findMany({
            where: { id: { in: variantIds } },
            select: { id: true },
        });
        if (variants.length !== variantIds.length) {
            return NextResponse.json(
                { error: "One or more products/variants not found" },
                { status: 404 }
            );
        }

        const build = await prisma.savedBuild.create({
            data: {
                name: data.name,
                total: data.total,
                items: {
                    create: data.items.map((i) => ({
                        variantId: i.variantId,
                        quantity: i.quantity,
                    })),
                },
            },
            include: {
                items: {
                    include: {
                        variant: { include: { product: { include: { specs: true, brand: true } } } },
                    },
                },
            },
        });

        return NextResponse.json(build, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("POST /api/builds error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
