// app/api/init/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Category } from '@/generated/prisma/client'

// ── Build tree from flat records (same logic as /api/categories/hierarchy) ────
type HierarchyRecord = {
  id: string;
  label: string;
  category: Category | null;
  query: string | null;
  brand: string | null;
  parentId: string | null;
  sortOrder: number;
};

function buildTree(records: HierarchyRecord[]) {
  const map = new Map<string, HierarchyRecord & { children: any[] }>();
  const roots: (HierarchyRecord & { children: any[] })[] = [];
  for (const r of records) {
    map.set(r.id, { ...r, children: [] });
  }
  for (const r of records) {
    const node = map.get(r.id)!;
    if (r.parentId && map.has(r.parentId)) {
      map.get(r.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

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
    prisma.categoryHierarchy.findMany({ orderBy: { sortOrder: 'asc' } }).then(buildTree),
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