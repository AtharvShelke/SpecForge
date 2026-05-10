import StorefrontPageClient from '@/components/storefront/StorefrontPageClient'
import { prisma } from '@/lib/prisma'
import { CategoryNode } from '@/types'

type CategoryDefinitionRecord = {
  code: string
  label: string
  shortLabel: string | null
}

type HierarchyRecord = {
  id: string
  label: string
  categoryDefinitionId: string | null
  categoryDefinition: { id: string; code: string; label: string; shortLabel: string | null } | null
  query: string | null
  brand: string | null
  parentId: string | null
  sortOrder: number
}

type RawSpec = {
  id: string
  productId: string
  value: string
  filterValue: {
    filterDefinition: {
      key: string
    } | null
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
  category: { id: number; name: string; slug: string } | null,
  definitions: CategoryDefinitionRecord[]
) {
  if (!category) return undefined

  const categoryKeys = new Set([
    normalizeIdentifier(category.name),
    normalizeIdentifier(category.slug),
  ])

  const definition = definitions.find((item) => {
    const definitionKeys = [
      normalizeIdentifier(item.code),
      normalizeIdentifier(item.label),
      normalizeIdentifier(item.shortLabel),
      normalizeIdentifier(slugify(item.label)),
    ].filter(Boolean)

    return definitionKeys.some((key) => categoryKeys.has(key))
  })

  return definition?.code ?? category.slug ?? category.name
}

function mapSpec(spec: RawSpec) {
  return {
    id: spec.id,
    productId: spec.productId,
    key: spec.filterValue?.filterDefinition?.key ?? '',
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
      category: record.categoryDefinition?.code as any,
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
  const [products, categoryRecords, brands, buildGuides, categoryDefinitions] = await Promise.all([
    prisma.product.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
      take: 1000,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        
        specs: {
          select: {
            id: true,
            productId: true,
            value: true,
            filterValue: {
              select: {
                filterDefinition: {
                  select: {
                    key: true,
                  },
                },
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
        categoryDefinitionId: true,
        categoryDefinition: {
          select: {
            id: true,
            code: true,
            label: true,
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
    prisma.categoryDefinition.findMany({
      where: { isActive: true },
      select: {
        code: true,
        label: true,
        shortLabel: true,
      },
    }),
  ])

  const categories = buildTree(categoryRecords)
  const storefrontBrands = brands.map(({ _count, ...brand }) => brand)
  const storefrontProducts = products.map((product) => ({
    ...product,
    category: resolveCategoryCode(product.category, categoryDefinitions),
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
      products={storefrontProducts as any}
      categories={categories}
      brands={storefrontBrands as any}
      buildGuides={storefrontBuildGuides as any}
    />
  )
}
