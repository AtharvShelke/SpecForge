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

// ── GET /api/build-guides ─────────────────────────────────────
export async function GET() {
    try {
        const builds = await prisma.buildGuide.findMany({
            select: {
                id: true,
                title: true,
                description: true,
                category: true,
                total: true,
                createdAt: true,
                items: {
                    select: {
                        id: true,
                        variantId: true,
                        quantity: true,
                        variant: {
                            select: {
                                id: true,
                                sku: true,
                                price: true,
                                status: true,
                                product: {
                                    select: {
                                        id: true,
                                        name: true,
                                        category: true,
                                        brand: { select: { id: true, name: true } },
                                        media: { select: { url: true }, take: 1, orderBy: { sortOrder: 'asc' } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        return NextResponse.json(builds);
    } catch (error) {
        console.error("GET /api/builds error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── POST /api/build-guides ────────────────────────────────────
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

        const build = await prisma.buildGuide.create({
            data: {
                title: data.name,
                total: data.total,
                items: {
                    create: data.items.map((i) => ({
                        variantId: i.variantId,
                        quantity: i.quantity,
                    })),
                },
            },
            select: {
                id: true,
                title: true,
                total: true,
                createdAt: true,
                items: {
                    select: {
                        id: true,
                        variantId: true,
                        quantity: true,
                        variant: {
                            select: {
                                id: true,
                                sku: true,
                                price: true,
                                product: {
                                    select: {
                                        id: true,
                                        name: true,
                                        category: true,
                                        brand: { select: { id: true, name: true } },
                                        media: { select: { url: true }, take: 1, orderBy: { sortOrder: 'asc' } },
                                    },
                                },
                            },
                        },
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
