import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const revalidate = 3600 // Cache for 1 hour

export async function GET() {
    try {
        // Fetch categories with product aggregates grouped inside the database query
        const categories = await prisma.category.findMany({
            where: {
                // Adjust filter flags if you use custom active fields
                isActive: true 
            },
            take: 4,
            select: {
                id: true,
                code: true,
                shortLabel: true, // fallback to c.name handled client-side
                name: true,
                image: true,
                _count: {
                    select: { products: true }
                }
            },
            orderBy: {
                displayOrder: 'asc'
            }
        })

        // Map into expected client-side contract
        const formattedCategories = categories.map(c => ({
            category: (c.code || c.name || '').toLowerCase(),
            shortLabel: c.shortLabel || c.name || '',
            image: c.image || null,
            productCount: c._count.products
        }))

        return NextResponse.json(formattedCategories)
    } catch (error) {
        console.error('Storefront Categories API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }
}