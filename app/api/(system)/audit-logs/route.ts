import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const actor = searchParams.get("actor");

    const query: any = {
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit results for performance
    };

    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (actor) where.actor = actor;

    if (Object.keys(where).length > 0) {
      query.where = where;
    }

    const logs = await prisma.auditLog.findMany(query);
    return NextResponse.json(logs);
  } catch (error: any) {
    console.error("[GET_AUDIT_LOGS]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      entityType, 
      entityId, 
      action, 
      actor = "System", 
      before, 
      after, 
      metadata 
    } = body;

    if (!entityType || !entityId || !action) {
      return new NextResponse("entityType, entityId, and action are required", { status: 400 });
    }

    const log = await prisma.auditLog.create({
      data: {
        entityType,
        entityId,
        action,
        actor,
        before,
        after,
        metadata
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error: any) {
    console.error("[POST_AUDIT_LOGS]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
