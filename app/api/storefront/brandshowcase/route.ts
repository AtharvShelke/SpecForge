import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma' // Adjust based on your actual Prisma client location

export const revalidate = 86400 // Cache for 24 hours

export async function GET() {
    try {
        const brands = await prisma.brand.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: {
                name: 'asc'
            }
        })

        return NextResponse.json(brands)
    } catch (error) {
        console.error('Storefront Brand API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 })
    }
}