import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ReviewStatusEnum = z.enum(["PENDING", "APPROVED", "REJECTED"]);

const updateReviewSchema = z.object({
    status: ReviewStatusEnum,
});

// ── PATCH /api/reviews/[id] ─────────────────────────────
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const data = updateReviewSchema.parse(body);

        const existing = await prisma.review.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Review not found" }, { status: 404 });
        }

        const review = await prisma.review.update({
            where: { id },
            data: { status: data.status },
        });

        return NextResponse.json(review);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("PATCH /api/reviews/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
