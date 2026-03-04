import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server"


// In a real production app, this would be an actual external email provider API call
// like Resend: resend.emails.send({...})
async function mockSendEmail(to: string, subject: string, templateId: string, data: any) {
    console.log(`[EMAIL MOCK] Sending to: ${to} | Subject: ${subject} | Template: ${templateId}`)
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500))
    return { id: "mock_id_" + Date.now() }
}

export async function GET(req: Request) {
    // 1. Authenticate this cron job request!
    // E.g. check for an Authorization header with a CRON_SECRET from env vars
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'secret_cron_key'}`) {
        // In dev, we might bypass this or just log a warning. For safety in this example:
        if (process.env.NODE_ENV === 'production') {
            return new NextResponse('Unauthorized', { status: 401 });
        }
    }

    try {
        // 2. Fetch all currently active campaigns
        const activeCampaigns = await prisma.marketingCampaign.findMany({
            where: { isActive: true }
        });

        if (activeCampaigns.length === 0) {
            return NextResponse.json({ message: "No active campaigns to process." });
        }

        const results = [];

        // 3. Process each campaign
        for (const campaign of activeCampaigns) {
            const rules = campaign.rulesConfig as any;
            const delayHours = rules?.delayHours || 0;

            // Calculate the "cutoff" time. E.g. If delay is 2 hours, we look for events older than 2 hours.
            const cutoffTime = new Date();
            cutoffTime.setHours(cutoffTime.getHours() - delayHours);

            // Find leads that had the triggering event BEFORE the cutoff time
            const eligibleEvents = await prisma.marketingEvent.findMany({
                where: {
                    type: campaign.triggerType,
                    createdAt: { lte: cutoffTime }
                },
                include: { lead: true }
            });

            let sentCount = 0;

            for (const event of eligibleEvents) {
                const lead = event.lead;

                // Skip if unsubscribed
                if (lead.unsubscribed) continue;

                // Check if we already sent an email for THIS campaign to THIS lead
                const existingLog = await prisma.emailLog.findFirst({
                    where: {
                        leadId: lead.id,
                        campaignId: campaign.id
                    }
                });

                if (existingLog) {
                    // Already processed this lead for this campaign
                    continue;
                }

                // --- Custom Business Logic Rules Check (Example) ---
                let passesRules = true;
                if (campaign.triggerType === "CART_ABANDONED") {
                    // Re-check if the cart is still "abandoned". E.g. did they make a purchase since?
                    // We could look up the latest order for this customerId, or check if a "CHECKOUT_COMPLETED"
                    // event happened *after* the abandoned cart event.

                    const newerPurchaseEvent = await prisma.marketingEvent.findFirst({
                        where: {
                            leadId: lead.id,
                            type: "CUSTOM", // Assuming we track purchases as customized events
                            createdAt: { gt: event.createdAt }
                        }
                    });

                    if (newerPurchaseEvent) {
                        passesRules = false; // They already bought! Skip sending.
                    }
                }

                if (!passesRules) continue;

                // --- Send Email ---
                try {
                    const subject = rules?.subject || "Update from our store";
                    const templateId = rules?.templateId || "default_marketing";

                    await mockSendEmail(lead.email, subject, templateId, event.metadata);

                    // Log the successful send
                    await prisma.emailLog.create({
                        data: {
                            leadId: lead.id,
                            campaignId: campaign.id,
                            subject: subject,
                            status: "SENT"
                        }
                    });

                    sentCount++;

                } catch (emailError) {
                    console.error(`Failed to send email to ${lead.email}`, emailError);
                    // Could create a FAILED log here
                }
            }

            results.push({
                campaign: campaign.name,
                processedEvents: eligibleEvents.length,
                emailsSent: sentCount
            });
        }

        return NextResponse.json({ success: true, processingResults: results });

    } catch (error) {
        console.error("Cron job error:", error);
        return NextResponse.json({ error: "Internal server error during campaign processing" }, { status: 500 });
    }
}
