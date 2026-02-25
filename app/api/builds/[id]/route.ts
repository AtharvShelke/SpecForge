import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ── GET /api/builds/[id] ────────────────────────────────
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const build = await prisma.savedBuild.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: { include: { specs: true, brand: true } },
                    },
                },
            },
        });

        if (!build) {
            return NextResponse.json({ error: "Build not found" }, { status: 404 });
        }

        return NextResponse.json(build);
    } catch (error) {
        console.error("GET /api/builds/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── DELETE /api/builds/[id] ─────────────────────────────
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const existing = await prisma.savedBuild.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Build not found" }, { status: 404 });
        }

        await prisma.savedBuild.delete({ where: { id } });
        return NextResponse.json({ message: "Build deleted" });
    } catch (error) {
        console.error("DELETE /api/builds/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
