import { NextRequest, NextResponse } from "next/server"
import {prisma} from "@/lib/prisma"
import { MarketingEventType } from "@/generated/prisma/client"

export async function POST(req: NextRequest) {
    try {
        const { email, name, source, eventType, metadata } = await req.json()

        if (!email || !eventType) {
            return NextResponse.json({ error: "Missing required fields: email or eventType" }, { status: 400 })
        }

        if (!Object.values(MarketingEventType).includes(eventType)) {
            return NextResponse.json({ error: "Invalid eventType" }, { status: 400 })
        }

        // 1. Upsert the Lead. If they already exist, we just ensure we have them tracked.
        const lead = await prisma.lead.upsert({
            where: { email },
            create: { email, name, source },
            update: {
                // We only update name/source if they aren't already set to avoid overwriting original source
                // but if they provide a new name, we might want to update it.
                ...(name && { name }),
            }
        })

        // 2. Record the Marketing Event linked to this Lead
        const event = await prisma.marketingEvent.create({
            data: {
                leadId: lead.id,
                type: eventType as MarketingEventType,
                metadata: metadata || {}
            }
        })

        return NextResponse.json({ success: true, leadId: lead.id, eventId: event.id })

    } catch (error) {
        console.error("Error logging marketing event:", error)
        return NextResponse.json({ error: "Failed to log event" }, { status: 500 })
    }
}
