import { NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const totalLeads = await prisma.lead.count();
        const activeCampaigns = await prisma.marketingCampaign.count({
            where: { isActive: true },
        });
        const totalCampaigns = await prisma.marketingCampaign.count();
        const emailsSent = await prisma.emailLog.count({
            where: { status: "SENT" },
        });

        // Calculate a rough conversion rate (Leads that have a connected Customer / Total Leads)
        const convertedLeads = await prisma.lead.count({
            where: {
                customerId: { not: null }
            }
        });

        const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : "0.0";

        return NextResponse.json({
            totalLeads,
            activeCampaigns,
            totalCampaigns,
            emailsSent,
            conversionRate
        });

    } catch (error) {
        console.error("Error fetching marketing stats:", error);
        return NextResponse.json({ error: "Failed to fetch marketing stats" }, { status: 500 });
    }
}
