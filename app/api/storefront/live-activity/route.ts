import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic' // Always pull live metrics for activity updates

export async function GET() {
    try {
        const recentOrders = await prisma.order.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                customerName: true,
                createdAt: true,
                items: {
                    select: {
                        quantity: true,
                        product: { select: { name: true } }
                    }
                }
            }
        })

        const activities = recentOrders.map(order => {
            const totalItems = order.items.reduce((acc, item) => acc + item.quantity, 0)
            const topItemName = order.items[0]?.product?.name || 'Premium Hardware'
            
            return {
                id: order.id,
                customerName: order.customerName || 'Anonymous Builder',
                itemsCount: totalItems,
                topItemName: topItemName
            }
        })

        return NextResponse.json(activities)
    } catch (error) {
        console.error('Storefront Activity API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch live metrics' }, { status: 500 })
    }
}