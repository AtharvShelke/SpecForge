import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const HIERARCHY_SELECT = {
  id: true,
  label: true,
  query: true,
  brand: true,
  parentId: true,
  sortOrder: true,
  categoryDefinition: {
    select: {
      id: true,
      code: true,
      label: true,
      shortLabel: true,
    },
  },
} as const;

type HierarchyRecord = {
  id: string;
  label: string;
  query: string | null;
  brand: string | null;
  parentId: string | null;
  sortOrder: number;
  categoryDefinition: {
    id: string;
    code: string;
    label: string;
    shortLabel: string | null;
  } | null;
};

type TreeNode = HierarchyRecord & {
  category: string | null;
  categoryDefinitionId: string | null;
  children: TreeNode[];
};

const nodeSchema: z.ZodType<{
  label: string;
  category?: string;
  query?: string;
  brand?: string;
  sortOrder?: number;
  children?: Array<any>;
}> = z.lazy(() =>
  z.object({
    label: z.string().min(1),
    category: z.string().min(1).optional(),
    query: z.string().optional(),
    brand: z.string().optional(),
    sortOrder: z.number().int().default(0),
    children: z.array(nodeSchema).default([]),
  })
);

const hierarchySchema = z.array(nodeSchema);

function buildTree(records: HierarchyRecord[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  for (const record of records) {
    map.set(record.id, {
      ...record,
      category: record.categoryDefinition?.code ?? null,
      categoryDefinitionId: record.categoryDefinition?.id ?? null,
      children: [],
    });
  }

  for (const record of records) {
    const node = map.get(record.id)!;
    if (record.parentId && map.has(record.parentId)) {
      map.get(record.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

type FlatNode = {
  id: string;
  label: string;
  categoryDefinitionId: string | null;
  query: string | null;
  brand: string | null;
  parentId: string | null;
  sortOrder: number;
};

function flattenTree(
  nodes: Array<{
    label: string;
    category?: string;
    query?: string;
    brand?: string;
    sortOrder?: number;
    children?: Array<any>;
  }>,
  categoryIdByCode: Map<string, string>,
  parentId: string | null
): FlatNode[] {
  const flat: FlatNode[] = [];

  nodes.forEach((node, index) => {
    const id = crypto.randomUUID();
    const categoryDefinitionId = node.category ? categoryIdByCode.get(node.category) ?? null : null;

    flat.push({
      id,
      label: node.label,
      categoryDefinitionId,
      query: node.query ?? null,
      brand: node.brand ?? null,
      parentId,
      sortOrder: node.sortOrder ?? index,
    });

    if (node.children && node.children.length > 0) {
      flat.push(...flattenTree(node.children, categoryIdByCode, id));
    }
  });

  return flat;
}

export async function GET() {
  try {
    const records = await prisma.categoryHierarchy.findMany({
      select: HIERARCHY_SELECT,
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    });

    return NextResponse.json(buildTree(records), {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('GET /api/categories/hierarchy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const tree = hierarchySchema.parse(await req.json());

    const categoryDefinitions = await prisma.categoryDefinition.findMany({
      select: {
        id: true,
        code: true,
      },
    });

    const categoryIdByCode = new Map(categoryDefinitions.map((category) => [category.code, category.id]));
    const flat = flattenTree(tree, categoryIdByCode, null);

    await prisma.$transaction(async (tx) => {
      await tx.categoryHierarchy.deleteMany();

      if (flat.length > 0) {
        await tx.categoryHierarchy.createMany({
          data: flat,
        });
      }
    });

    const records = await prisma.categoryHierarchy.findMany({
      select: HIERARCHY_SELECT,
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    });

    return NextResponse.json(buildTree(records));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }

    console.error('PUT /api/categories/hierarchy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
