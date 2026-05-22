import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const revalidate = 600 // Cache for 10 minutes

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            where: {
                isFeatured: true,
                status: 'ACTIVE' // Adjust string matching your enum setup
            },
            take: 40,
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
                    select: { code: true, showInFeatured: true, featuredOrder: true, displayOrder: true }
                }
            }
        })

        return NextResponse.json(products)
    } catch (error) {
        console.error('Storefront Products API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch featured products' }, { status: 500 })
    }
}