import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Fetch emails from all three models
        const [leadEmails, customerEmails, orderEmails] = await Promise.all([
            prisma.lead.findMany({ select: { email: true } }),
            prisma.customer.findMany({ select: { email: true } }),
            prisma.order.findMany({ select: { email: true } }),
        ]);

        // Fetch phone numbers from Customer and Order
        const [customerPhones, orderPhones] = await Promise.all([
            prisma.customer.findMany({
                where: {
                    AND: [
                        { phone: { not: null } },
                        { phone: { not: "" } }
                    ]
                },
                select: { phone: true }
            }),
            prisma.order.findMany({
                where: {
                    AND: [
                        { phone: { not: null } },
                        { phone: { not: "" } }
                    ]
                },
                select: { phone: true }
            }),
        ]);

        // Use Set for unique values
        const emailSet = new Set<string>();
        leadEmails.forEach(e => emailSet.add(e.email.trim().toLowerCase()));
        customerEmails.forEach(e => emailSet.add(e.email.trim().toLowerCase()));
        orderEmails.forEach(e => emailSet.add(e.email.trim().toLowerCase()));

        const phoneSet = new Set<string>();
        customerPhones.forEach(p => {
            if (p.phone) phoneSet.add(p.phone.trim());
        });
        orderPhones.forEach(p => {
            if (p.phone) phoneSet.add(p.phone.trim());
        });

        const uniqueEmails = Array.from(emailSet).sort();
        const uniquePhones = Array.from(phoneSet).sort();

        return NextResponse.json({
            emails: uniqueEmails,
            phoneNumbers: uniquePhones,
            counts: {
                emails: uniqueEmails.length,
                phoneNumbers: uniquePhones.length
            }
        });

    } catch (error) {
        console.error("Error fetching all contacts:", error);
        return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
    }
}
