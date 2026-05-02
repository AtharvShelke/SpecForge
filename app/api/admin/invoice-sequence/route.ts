import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const SEQ_ID = "invoice_seq";

/**
 * GET /api/admin/invoice-sequence
 * Returns the current InvoiceSequence counter value and metadata.
 */
export async function GET() {
  try {
    const seq = await prisma.invoiceSequence.findUnique({
      where: { id: SEQ_ID },
    });

    if (!seq) {
      return NextResponse.json({ id: SEQ_ID, currentValue: 0 });
    }

    return NextResponse.json(seq);
  } catch (error) {
    console.error("[invoice-sequence] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice sequence" },
      { status: 500 },
    );
  }
}

const ResetSchema = z.object({
  currentValue: z
    .number()
    .int("Must be an integer")
    .min(0, "Cannot be negative"),
});

/**
 * POST /api/admin/invoice-sequence
 * Resets the invoice sequence counter to the specified value.
 *
 * Body: { currentValue: number }
 *
 * ⚠️  Setting the counter below the current highest invoice number will cause
 *     duplicate invoice number errors. Always reset upward or to a safe value.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ResetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const seq = await prisma.invoiceSequence.upsert({
      where: { id: SEQ_ID },
      update: { currentValue: parsed.data.currentValue },
      create: { id: SEQ_ID, currentValue: parsed.data.currentValue },
    });

    return NextResponse.json(seq);
  } catch (error) {
    console.error("[invoice-sequence] POST error:", error);
    return NextResponse.json(
      { error: "Failed to update invoice sequence" },
      { status: 500 },
    );
  }
}
