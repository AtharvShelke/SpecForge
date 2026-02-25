import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ReviewStatusEnum = z.enum(["PENDING", "APPROVED", "REJECTED"]);

const createReviewSchema = z.object({
    productId: z.string().uuid(),
    customerName: z.string().min(1),
    rating: z.number().int().min(1).max(5),
    comment: z.string().min(1),
});

// ── GET /api/reviews ────────────────────────────────────
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get("productId");
        const status = searchParams.get("status");

        const where: any = {};
        if (productId) where.productId = productId;
        if (status && ReviewStatusEnum.safeParse(status).success) {
            where.status = status;
        }

        const reviews = await prisma.review.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: { product: { select: { id: true, name: true, sku: true } } },
        });

        return NextResponse.json(reviews);
    } catch (error) {
        console.error("GET /api/reviews error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── POST /api/reviews ───────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const data = createReviewSchema.parse(body);

        // Verify product exists
        const product = await prisma.product.findUnique({ where: { id: data.productId } });
        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        const review = await prisma.review.create({
            data: {
                productId: data.productId,
                customerName: data.customerName,
                rating: data.rating,
                comment: data.comment,
                status: "PENDING",
            },
        });

        return NextResponse.json(review, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("POST /api/reviews error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
