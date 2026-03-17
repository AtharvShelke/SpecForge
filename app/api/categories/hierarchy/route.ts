import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { z } from "zod";
import { Category } from "@/generated/prisma";

// ── Category enum ────────────────────────────────────────
// Defined once at module scope — no re-allocation per request
const CategoryEnum = z.enum([
  "PROCESSOR", "GPU", "MOTHERBOARD", "RAM", "STORAGE",
  "PSU", "CABINET", "COOLER", "MONITOR", "PERIPHERAL", "NETWORKING", "LAPTOP",
]);

// ── Minimal select shape ─────────────────────────────────
// Explicitly select only the fields needed for the tree.
// Avoids fetching large text/json columns (e.g. timestamps, metadata)
// that aren't used by buildTree or the client.
const HIERARCHY_SELECT = {
  id: true,
  label: true,
  category: true,
  query: true,
  brand: true,
  parentId: true,
  sortOrder: true,
} as const;

type HierarchyRecord = {
  id: string;
  label: string;
  category: Category | null;
  query: string | null;
  brand: string | null;
  parentId: string | null;
  sortOrder: number;
};

// ── Helper: build tree from flat records ─────────────────
// O(n) — single pass with a Map.
// Typed to avoid `any` and prevent accidental field leakage.
function buildTree(records: HierarchyRecord[]): (HierarchyRecord & { children: any[] })[] {
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

// ── Schema (module-level) ─────────────────────────────────
// Parsed once per cold start, not per request.
// z.lazy() is kept for recursive type support, but hoisted here
// so Zod doesn't rebuild the schema object on every PUT call.
const nodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    label: z.string().min(1),
    category: CategoryEnum.optional(),
    query: z.string().optional(),
    brand: z.string().optional(),
    sortOrder: z.number().int().default(0),
    children: z.array(nodeSchema).default([]),
  })
);
const hierarchySchema = z.array(nodeSchema);

// ── GET /api/categories/hierarchy ────────────────────────
export async function GET() {
  try {
    // select: only fetch the 7 fields we actually use.
    // Eliminates extra I/O for any unmapped columns Prisma would
    // otherwise hydrate (createdAt, updatedAt, etc.).
    const records = await prisma.categoryHierarchy.findMany({
      select: HIERARCHY_SELECT,
      orderBy: { sortOrder: "asc" },
    });

    const tree = buildTree(records);

    // Cache-Control: safe for GET because this data is admin-managed
    // and changes rarely. 10 s stale-while-revalidate lets the CDN /
    // Next.js cache serve instantly and refresh in the background.
    // Adjust max-age / s-maxage to suit your deployment.
    return NextResponse.json(tree, {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error("GET /api/categories/hierarchy error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── Flatten helper (pure function, outside PUT) ───────────
// Moved out of PUT so it isn't re-declared on every request.
// Returns a pre-typed array — no `any[]` leaking into createMany.
type FlatNode = {
  id: string;
  label: string;
  category: Category | null;
  query: string | null;
  brand: string | null;
  parentId: string | null;
  sortOrder: number;
};

function flattenTree(nodes: any[], parentId: string | null, order: number): FlatNode[] {
  const result: FlatNode[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const id = crypto.randomUUID();
    result.push({
      id,
      label: nodes[i].label,
      category: (nodes[i].category as Category) ?? null,
      brand: nodes[i].brand ?? null,
      query: nodes[i].query ?? null,
      parentId,
      sortOrder: order + i,
    });
    if (nodes[i].children?.length) {
      result.push(...flattenTree(nodes[i].children, id, 0));
    }
  }
  return result;
}

// ── PUT /api/categories/hierarchy ────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const tree = hierarchySchema.parse(body);

    // Flatten BEFORE entering the transaction.
    // CPU work (UUID gen, recursion) happens outside the DB connection,
    // keeping the transaction window as short as possible.
    const flat = flattenTree(tree, null, 0);

    // Single transaction: delete-all + bulk insert.
    // skipDuplicates: false is intentional — we want hard failures
    // on collision rather than silent data loss.
    //
    // maxWait / timeout kept from original; tuned for large trees.
    // isolation level defaults to READ COMMITTED in PostgreSQL which
    // is fine here because we hold an exclusive delete + insert pattern.
    await prisma.$transaction(
      async (tx) => {
        await tx.categoryHierarchy.deleteMany();

        if (flat.length > 0) {
          await tx.categoryHierarchy.createMany({ data: flat });
        }
      },
      { maxWait: 5000, timeout: 30000 }
    );

    // Re-fetch inside the same request so the response reflects
    // exactly what was committed. Uses the same minimal select.
    const records = await prisma.categoryHierarchy.findMany({
      select: HIERARCHY_SELECT,
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(buildTree(records));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("PUT /api/categories/hierarchy error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}