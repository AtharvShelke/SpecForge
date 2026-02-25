import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CategoryEnum = z.enum([
    "PROCESSOR", "GPU", "MOTHERBOARD", "RAM", "STORAGE",
    "PSU", "CABINET", "COOLER", "MONITOR", "PERIPHERAL", "NETWORKING",
]);

// ── Helper: build tree from flat records ────────────────
function buildTree(records: any[]): any[] {
    const map = new Map<string, any>();
    const roots: any[] = [];

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

// ── GET /api/categories/hierarchy ───────────────────────
export async function GET() {
    try {
        const records = await prisma.categoryHierarchy.findMany({
            orderBy: { sortOrder: "asc" },
        });
        const tree = buildTree(records);
        return NextResponse.json(tree);
    } catch (error) {
        console.error("GET /api/categories/hierarchy error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── PUT /api/categories/hierarchy ───────────────────────
// Replace the entire hierarchy (delete + recreate)
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

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const tree = hierarchySchema.parse(body);

        await prisma.$transaction(async (tx) => {
            // Delete all existing hierarchy
            await tx.categoryHierarchy.deleteMany();

            // Flatten tree and insert in order
            const flatten = (nodes: any[], parentId: string | null, order: number): any[] => {
                const result: any[] = [];
                for (let i = 0; i < nodes.length; i++) {
                    const id = crypto.randomUUID();
                    result.push({
                        id,
                        label: nodes[i].label,
                        category: nodes[i].category || null,
                        query: nodes[i].query || null,
                        brand: nodes[i].brand || null,
                        parentId,
                        sortOrder: order + i,
                    });
                    if (nodes[i].children?.length) {
                        result.push(...flatten(nodes[i].children, id, 0));
                    }
                }
                return result;
            };

            const flat = flatten(tree, null, 0);
            // Insert in order (parents first)
            for (const node of flat) {
                await tx.categoryHierarchy.create({ data: node });
            }
        });

        // Return the new tree
        const records = await prisma.categoryHierarchy.findMany({
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
