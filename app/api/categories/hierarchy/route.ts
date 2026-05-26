import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// ─── Types ─────────────────────────────────────────────────────────────

interface CategoryHierarchyRecord {
  id: string;
  label: string;
  query: string | null;
  brand: string | null;
  parentId: string | null;
  sortOrder: number;
  category: {
    id: number;
    code: string;
    name: string;
    shortLabel: string | null;
  } | null;
}

interface CategoryTreeNode extends Omit<CategoryHierarchyRecord, 'category'> {
  category: string | null;
  categoryId: number | null;
  children: CategoryTreeNode[];
}

interface FlatCategoryNode {
  id: string;
  label: string;
  categoryId: number | null;
  query: string | null;
  brand: string | null;
  parentId: string | null;
  sortOrder: number;
}

// ─── Database Query Configuration ─────────────────────────────────────

const HIERARCHY_SELECT = {
  id: true,
  label: true,
  query: true,
  brand: true,
  parentId: true,
  sortOrder: true,
  category: {
    select: {
      id: true,
      code: true,
      name: true,
      shortLabel: true,
    },
  },
} as const;

// ─── Validation Schemas ──────────────────────────────────────────────────

const CategoryNodeSchema: z.ZodType<{
  label: string;
  category?: string;
  query?: string;
  brand?: string;
  sortOrder?: number;
  children?: Array<any>;
}> = z.lazy(() =>
  z.object({
    label: z.string().min(1, 'Label is required'),
    category: z.string().min(1, 'Category code must be valid').optional(),
    query: z.string().optional(),
    brand: z.string().optional(),
    sortOrder: z.number().int().min(0).default(0),
    children: z.array(CategoryNodeSchema).default([]),
  })
);

const CategoryHierarchySchema = z.array(CategoryNodeSchema).min(0, 'Hierarchy must be an array');

// ─── Tree Building Functions ─────────────────────────────────────────────

function buildCategoryTree(records: CategoryHierarchyRecord[]): CategoryTreeNode[] {
  const nodeMap = new Map<string, CategoryTreeNode>();
  const rootNodes: CategoryTreeNode[] = [];

  // Create all nodes first
  for (const record of records) {
    const treeNode: CategoryTreeNode = {
      ...record,
      category: record.category?.code ?? null,
      categoryId: record.category?.id ?? null,
      children: [],
    };
    nodeMap.set(record.id, treeNode);
  }

  // Build the tree structure
  for (const record of records) {
    const node = nodeMap.get(record.id)!;
    if (record.parentId && nodeMap.has(record.parentId)) {
      nodeMap.get(record.parentId)!.children.push(node);
    } else {
      rootNodes.push(node);
    }
  }

  return rootNodes;
}

function flattenCategoryTree(
  nodes: Array<{
    label: string;
    category?: string;
    query?: string;
    brand?: string;
    sortOrder?: number;
    children?: Array<any>;
  }>,
  categoryMap: Map<string, number>,
  parentId: string | null
): FlatCategoryNode[] {
  const flatNodes: FlatCategoryNode[] = [];

  nodes.forEach((node, index) => {
    const nodeId = crypto.randomUUID();
    const categoryId = node.category 
      ? categoryMap.get(node.category) ?? null 
      : null;

    // Validate that category exists if provided
    if (node.category && !categoryId) {
      throw new Error(`Category not found for code: ${node.category}`);
    }

    flatNodes.push({
      id: nodeId,
      label: node.label,
      categoryId,
      query: node.query ?? null,
      brand: node.brand ?? null,
      parentId,
      sortOrder: node.sortOrder ?? index,
    });

    // Recursively process children
    if (node.children && node.children.length > 0) {
      const childNodes = flattenCategoryTree(node.children, categoryMap, nodeId);
      flatNodes.push(...childNodes);
    }
  });

  return flatNodes;
}

// ─── API Endpoints ───────────────────────────────────────────────────────

export async function GET() {
  try {
    const records = await prisma.categoryHierarchy.findMany({
      select: HIERARCHY_SELECT,
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    });

    const tree = buildCategoryTree(records);

    return NextResponse.json(tree, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('GET /api/categories/hierarchy error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Failed to fetch category hierarchy' }, 
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const tree = CategoryHierarchySchema.parse(body);

    // Fetch all category definitions for validation
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        code: true,
        isActive: true,
      },
    });

    // Create map for efficient lookup
    const categoryMap = new Map(
      categories
        .filter(cat => cat.isActive) // Only use active categories
        .map((category) => [category.code, category.id])
    );

    // Flatten the tree and validate
    const flatNodes = flattenCategoryTree(tree, categoryMap, null);

    // Use transaction for data integrity
    await prisma.$transaction(async (tx) => {
      // Delete existing hierarchy
      await tx.categoryHierarchy.deleteMany();

      // Insert new hierarchy if not empty
      if (flatNodes.length > 0) {
        await tx.categoryHierarchy.createMany({
          data: flatNodes,
        });
      }
    });

    // Return the updated tree
    const updatedRecords = await prisma.categoryHierarchy.findMany({
      select: HIERARCHY_SELECT,
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    });

    const updatedTree = buildCategoryTree(updatedRecords);

    return NextResponse.json({
      success: true,
      data: updatedTree,
      message: `Updated hierarchy with ${flatNodes.length} nodes`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        }, 
        { status: 400 }
      );
    }

    console.error('PUT /api/categories/hierarchy error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: 'Failed to update category hierarchy' },
      { status: 500 }
    );
  }
}
