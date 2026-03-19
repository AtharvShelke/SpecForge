// app/api/init/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const revalidate = 60 // ISR: re-fetch at most once per minute

export async function GET() {
  const [products, categories, brands, filterConfigs, buildGuides] = await Promise.all([
    prisma.product.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
      include: {
        variants: { select: { id: true, sku: true, price: true, compareAtPrice: true, status: true, attributes: true } },
        specs:    { select: { id: true, key: true, value: true } },
        media:    { select: { id: true, url: true, altText: true, sortOrder: true }, orderBy: { sortOrder: 'asc' } },
        brand:    { select: { id: true, name: true } },
      },
    }),
    prisma.categoryHierarchy.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.brand.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    }),
    prisma.categoryFilterConfig.findMany({
      include: { filters: { orderBy: { sortOrder: 'asc' } } },
    }),
    prisma.buildGuide.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        items: {
          include: {
            variant: {
              select: { id: true, sku: true, price: true, status: true,
                product: { select: { id: true, name: true, category: true, brandId: true, media: { take: 1, select: { url: true } } } } }
            }
          }
        }
      }
    }),
  ])

  return NextResponse.json({ products, categories, brands, filterConfigs, buildGuides })
}