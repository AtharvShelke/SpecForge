import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const revalidate = 1200 // Cache for 20 minutes

export async function GET() {
    try {
        const enthusiastGpus = await prisma.product.findMany({
            where: {
                category: {
                    code: 'GPU'
                },
                price: {
                    gte: 60000
                },
                status: 'ACTIVE'
            },
            take: 6,
            orderBy: {
                price: 'desc'
            },
            select: {
                id: true,
                name: true,
                price: true,
                stockStatus: true,
                media: {
                    select: { url: true },
                    take: 1
                },
                brand: {
                    select: { name: true }
                },
                category: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                }
            }
        })

        return NextResponse.json(enthusiastGpus)
    } catch (error) {
        console.error('Storefront GPU Tier API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch GPU tier' }, { status: 500 })
    }
}