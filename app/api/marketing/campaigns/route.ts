import { NextRequest, NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";
import { MarketingEventType } from "@/generated/prisma/client";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const campaigns = await prisma.marketingCampaign.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { emailLogs: true }
                }
            }
        });

        return NextResponse.json(campaigns);

    } catch (error) {
        console.error("Error fetching campaigns:", error);
        return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, description, isActive, triggerType, rulesConfig } = body;

        if (!name || !triggerType) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const newCampaign = await prisma.marketingCampaign.create({
            data: {
                name,
                description,
                isActive: isActive || false,
                triggerType: triggerType as MarketingEventType,
                rulesConfig: rulesConfig || {}
            }
        });

        return NextResponse.json(newCampaign, { status: 201 });
    } catch (err) {
        console.error("Error creating campaign:", err);
        return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
    }
}
