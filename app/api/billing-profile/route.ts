import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CurrencyEnum = z.enum(["INR", "USD", "EUR", "GBP"]);

const billingProfileSchema = z.object({
    companyName: z.string().min(1),
    legalName: z.string().optional(),
    email: z.string().email(),
    phone: z.string().optional(),
    addressLine1: z.string().min(1),
    addressLine2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(1),
    gstin: z.string().optional(),
    currency: CurrencyEnum.default("INR"),
    logoUrl: z.string().optional(),
});

// ── GET /api/billing-profile ────────────────────────────
// Returns the first (and only) billing profile
export async function GET() {
    try {
        const profile = await prisma.billingProfile.findFirst();
        if (!profile) {
            return NextResponse.json(null);
        }
        return NextResponse.json(profile);
    } catch (error) {
        console.error("GET /api/billing-profile error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── PUT /api/billing-profile ────────────────────────────
// Upsert the single billing profile
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const data = billingProfileSchema.parse(body);

        const existing = await prisma.billingProfile.findFirst();

        let profile;
        if (existing) {
            profile = await prisma.billingProfile.update({
                where: { id: existing.id },
                data,
            });
        } else {
            profile = await prisma.billingProfile.create({ data });
        }

        return NextResponse.json(profile);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("PUT /api/billing-profile error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
