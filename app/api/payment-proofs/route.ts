import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createPaymentProofSchema = z.object({
    transactionId: z.string().min(1),
    proofUrl: z.string().url(),
    notes: z.string().optional(),
});

// ── GET /api/payment-proofs?orderId=xxx ───────────────────────
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const transactionId = searchParams.get("transactionId");

        const where: any = {};
        if (transactionId) {
            where.transactionId = transactionId;
        }

        const proofs = await prisma.paymentProof.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ items: proofs });
    } catch (error) {
        console.error("GET /api/payment-proofs error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── POST /api/payment-proofs ──────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const data = createPaymentProofSchema.parse(body);

        // Verify transaction exists
        const transaction = await prisma.paymentTransaction.findUnique({
            where: { id: data.transactionId },
            include: { order: true }
        });
        if (!transaction) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        const proof = await prisma.paymentProof.create({
            data: {
                transactionId: data.transactionId,
                proofUrl: data.proofUrl,
                
            },
        });

        // Auto-update order paymentStatus
        await prisma.order.update({
            where: { id: transaction.orderId },
            data: {
                paymentStatus: "PENDING", // Denoting it awaits approval
                logs: {
                    create: {
                        status: transaction.order.status,
                        note: "Customer uploaded manual payment proof. Awaiting verification.",
                    }
                }
            }
        });

        return NextResponse.json(proof, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("POST /api/payment-proofs error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
