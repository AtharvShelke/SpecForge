'use server';

import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@/types'; // Or from generated prisma client

export async function getRecentActivity() {
    try {
        const orders = await prisma.order.findMany({
            where: {
                status: {
                    in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED']
                }
            },
            orderBy: { date: 'desc' },
            take: 5,
            select: {
                id: true,
                customerName: true,
                date: true,
                items: {
                    select: {
                        name: true,
                        quantity: true
                    }
                }
            }
        });

        return orders.map(order => {
            // Anonymize name: "Arjun Kapoor" -> "A**** K****"
            const parts = order.customerName.split(' ');
            const anonymized = parts.map(p => {
                if (p.length <= 1) return p;
                return p.charAt(0) + '*'.repeat(p.length - 1);
            }).join(' ');

            return {
                id: order.id,
                customerName: anonymized,
                date: order.date,
                itemsCount: order.items.reduce((acc: number, item: { name: string, quantity: number }) => acc + item.quantity, 0),
                topItemName: order.items[0]?.name || 'PC Components'
            };
        });
    } catch (e) {
        console.error('Failed to fetch recent activity:', e);
        return [];
    }
}
