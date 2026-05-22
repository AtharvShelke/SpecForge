import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const revalidate = 600 // Cache for 10 minutes

export async function GET() {
    try {
        const builds = await prisma.buildGuide.findMany({
            take: 4,
            orderBy: {
                createdAt: 'desc'
            },
            select: {
                id: true,
                title: true,
                description: true,
                total: true,
                createdAt: true,
                category: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                items: {
                    select: {
                        id: true,
                        productId: true,
                        quantity: true,
                        product: {
                            select: {
                                id: true,
                                name: true,
                                sku: true,
                                price: true,
                                stockStatus: true,
                                brand: {
                                    select: {
                                        name: true
                                    }
                                },
                                category: {
                                    select: {
                                        id: true,
                                        name: true,
                                        code: true
                                    }
                                },
                                media: {
                                    select: {
                                        url: true
                                    },
                                    take: 1,
                                    orderBy: {
                                        sortOrder: 'asc'
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        return NextResponse.json(builds)
    } catch (error) {
        console.error('Storefront Featured Builds API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch storefront featured builds' }, { status: 500 })
    }
}
