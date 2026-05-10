import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInvoiceHTML } from "@/lib/invoice";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: { include: { assignedUnits: true } },
                logs: { orderBy: { timestamp: "asc" } },
                invoices: { include: { lineItems: true } },
                payments: { orderBy: { createdAt: "desc" } },
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        let html = generateInvoiceHTML(order as any);
        html = html.replace('</body></html>', '<script>window.onload=function(){window.print();}</script></body></html>');

        return new NextResponse(html, {
            status: 200,
            headers: {
                "Content-Type": "text/html",
            },
        });
    } catch (error) {
        console.error("GET /api/orders/[id]/invoice error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
