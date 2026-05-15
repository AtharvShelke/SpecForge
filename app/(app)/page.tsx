import StorefrontPageClient from '@/components/storefront/StorefrontPageClient'
import { prisma } from '@/lib/prisma'
import { CategoryNode } from '@/types'

type CategoryRecord = {
  id: number
  code: string
  name: string
  slug: string
  shortLabel: string | null
}

type HierarchyRecord = {
  id: string
  label: string
  categoryId: number | null
  category: { id: number; code: string; name: string; shortLabel: string | null } | null
  query: string | null
  brand: string | null
  parentId: string | null
  sortOrder: number
}

type RawSpec = {
  id: string
  productId: string
  value: string
  attribute: {
    key: string
  } | null
}

function normalizeIdentifier(value: string | null | undefined) {
  return (value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function resolveCategoryCode(
  category: { id: number; code: string; name: string; slug: string } | null,
  categories: CategoryRecord[]
) {
  if (!category) return undefined
  const match = categories.find((item) => item.id === category.id)
  return match?.code ?? category.code ?? category.slug ?? category.name
}

function mapSpec(spec: RawSpec) {
  return {
    id: spec.id,
    productId: spec.productId,
    key: spec.attribute?.key ?? '',
    value: spec.value,
  }
}

function buildTree(records: HierarchyRecord[]): CategoryNode[] {
  const map = new Map<string, CategoryNode & { id: string; parentId?: string | null; sortOrder?: number }>()
  const roots: CategoryNode[] = []

  for (const record of records) {
    map.set(record.id, {
      id: record.id,
      label: record.label,
      category: record.category
        ? {
            id: record.category.id,
            code: record.category.code,
            name: record.category.name,
            slug: slugify(record.category.name),
            shortLabel: record.category.shortLabel,
          }
        : null,
      query: record.query ?? undefined,
      brand: record.brand ?? undefined,
      parentId: record.parentId ?? undefined,
      sortOrder: record.sortOrder,
      children: [],
    })
  }

  for (const record of records) {
    const node = map.get(record.id)!
    if (record.parentId && map.has(record.parentId)) {
      map.get(record.parentId)!.children!.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

export const revalidate = 60

export default async function StorefrontPage() {
  const [products, categoryRecords, brands, buildGuides, categoriesMaster] = await Promise.all([
    prisma.product.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
      take: 1000,
      include: {
        category: {
          select: {
            id: true,
            code: true,
            name: true,
            slug: true,
          },
        },
        
        specs: {
          select: {
            id: true,
            productId: true,
            value: true,
            attribute: {
              select: {
                key: true,
              },
            },
          },
        },
        media: {
          select: { id: true, productId: true, url: true, altText: true, sortOrder: true },
          orderBy: { sortOrder: 'asc' },
        },
        tags: true,
        brand: { select: { id: true, name: true, createdAt: true, updatedAt: true } },
      },
    }),
    prisma.categoryHierarchy.findMany({
      select: {
        id: true,
        label: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            code: true,
            name: true,
            shortLabel: true,
          },
        },
        query: true,
        brand: true,
        parentId: true,
        sortOrder: true,
      },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.brand.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    }),
    prisma.buildGuide.findMany({
      orderBy: { createdAt: 'desc' },
      take: 4,
      include: {
        items: true,
      },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
        slug: true,
        shortLabel: true,
      },
    }),
  ])

  const categories = buildTree(categoryRecords)
  const storefrontBrands = brands.map(({ _count, ...brand }) => brand)
  const storefrontProducts = products.map((product) => ({
    ...product,
    category: product.category,
    specs: product.specs.map(mapSpec),
  }))
  const storefrontBuildGuides = buildGuides.map((buildGuide) => ({
    ...buildGuide,
    items: buildGuide.items.map((item) => ({
      ...item,
      
    })),
  }))

  return (
    <StorefrontPageClient
      products={storefrontProducts}
      categories={categories}
      brands={storefrontBrands}
      buildGuides={storefrontBuildGuides}
    />
  )
}
