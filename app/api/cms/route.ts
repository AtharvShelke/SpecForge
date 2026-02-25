import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const cmsContentSchema = z.any(); // Content is stored as Json in DB

const createPageSchema = z.object({
    content: cmsContentSchema,
    isPublished: z.boolean().default(false),
    label: z.string().optional(),     // For version label
    actor: z.string().optional(),      // Who made the change
});

// ── GET /api/cms ────────────────────────────────────────
// Returns the published landing page (or latest draft)
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const publishedOnly = searchParams.get("published") !== "false";

        const page = await prisma.cMSLandingPage.findFirst({
            where: publishedOnly ? { isPublished: true } : undefined,
            orderBy: { updatedAt: "desc" },
        });

        if (!page) {
            return NextResponse.json(null);
        }

        return NextResponse.json(page);
    } catch (error) {
        console.error("GET /api/cms error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── POST /api/cms ───────────────────────────────────────
// Create or update the landing page + save version
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const data = createPageSchema.parse(body);

        const result = await prisma.$transaction(async (tx) => {
            // Find existing page or create new
            let page = await tx.cMSLandingPage.findFirst();

            if (page) {
                page = await tx.cMSLandingPage.update({
                    where: { id: page.id },
                    data: {
                        content: data.content,
                        isPublished: data.isPublished,
                        publishedAt: data.isPublished ? new Date() : page.publishedAt,
                    },
                });
            } else {
                page = await tx.cMSLandingPage.create({
                    data: {
                        content: data.content,
                        isPublished: data.isPublished,
                        publishedAt: data.isPublished ? new Date() : null,
                    },
                });
            }

            // Save version snapshot
            await tx.cMSLandingPageVersion.create({
                data: {
                    pageId: page.id,
                    content: data.content,
                    label: data.label,
                    actor: data.actor,
                },
            });

            return page;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("POST /api/cms error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
