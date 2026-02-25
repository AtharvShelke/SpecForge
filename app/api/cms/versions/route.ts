import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ── GET /api/cms/versions ───────────────────────────────
export async function GET() {
    try {
        const page = await prisma.cMSLandingPage.findFirst();
        if (!page) {
            return NextResponse.json({ versions: [], current: null });
        }

        const versions = await prisma.cMSLandingPageVersion.findMany({
            where: { pageId: page.id },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        return NextResponse.json({
            versions,
            current: page.id,
        });
    } catch (error) {
        console.error("GET /api/cms/versions error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── POST /api/cms/versions ──────────────────────────────
// Restore a version by ID
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { versionId } = body;

        if (!versionId) {
            return NextResponse.json({ error: "versionId is required" }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const version = await tx.cMSLandingPageVersion.findUnique({
                where: { id: versionId },
            });
            if (!version) throw new Error("NOT_FOUND");

            const page = await tx.cMSLandingPage.update({
                where: { id: version.pageId },
                data: {
                    content: version.content!,
                    isPublished: true,
                    publishedAt: new Date(),
                },
            });

            // Log restoration as a new version
            await tx.cMSLandingPageVersion.create({
                data: {
                    pageId: page.id,
                    content: version.content!,
                    label: `Restored from version ${versionId}`,
                    actor: "System",
                },
            });

            return page;
        });

        return NextResponse.json(result);
    } catch (error: any) {
        if (error?.message === "NOT_FOUND") {
            return NextResponse.json({ error: "Version not found" }, { status: 404 });
        }
        console.error("POST /api/cms/versions error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
