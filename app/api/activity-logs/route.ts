import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

function mapLog(log: {
  id: string;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  details: unknown;
  createdAt: Date;
  teamId: string | null;
}) {
  return {
    id: log.id,
    action: log.action,
    resource_type: log.resourceType,
    resource_id: log.resourceId,
    details: log.details,
    created_at: log.createdAt,
    team_id: log.teamId,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "user") {
      const userId = searchParams.get("userId");
      if (!userId) {
        return NextResponse.json({ error: "userId is required" }, { status: 400 });
      }

      const limit = Number(searchParams.get("limit") || "50");
      const offset = Number(searchParams.get("offset") || "0");
      const dateFrom = searchParams.get("dateFrom");
      const dateTo = searchParams.get("dateTo");
      const actions = searchParams.get("actions")?.split(",").filter(Boolean);

      const where: Record<string, unknown> = { userId };
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom);
        if (dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(dateTo);
      }
      if (actions && actions.length > 0) {
        where.action = { in: actions };
      }

      const [data, count] = await Promise.all([
        prisma.activityLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: offset,
          take: limit,
        }),
        prisma.activityLog.count({ where }),
      ]);

      return NextResponse.json(
        {
          data: data.map(mapLog),
          error: null,
          count,
        },
        { status: 200 }
      );
    }

    if (action === "team") {
      const teamId = searchParams.get("teamId");
      if (!teamId) {
        return NextResponse.json({ error: "teamId is required" }, { status: 400 });
      }

      const limit = Number(searchParams.get("limit") || "100");
      const offset = Number(searchParams.get("offset") || "0");
      const dateFrom = searchParams.get("dateFrom");
      const dateTo = searchParams.get("dateTo");
      const userId = searchParams.get("userId");

      const where: Record<string, unknown> = { teamId };
      if (userId) where.userId = userId;
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom);
        if (dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(dateTo);
      }

      const [data, count] = await Promise.all([
        prisma.activityLog.findMany({
          where,
          include: {
            user: {
              select: { id: true, fullName: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: offset,
          take: limit,
        }),
        prisma.activityLog.count({ where }),
      ]);

      return NextResponse.json(
        {
          data: data.map((item) => ({
            ...mapLog(item),
            users: {
              id: item.user.id,
              full_name: item.user.fullName,
              email: item.user.email,
              avatar_url: null,
            },
          })),
          error: null,
          count,
        },
        { status: 200 }
      );
    }

    if (action === "resource") {
      const resourceType = searchParams.get("resourceType");
      const resourceId = searchParams.get("resourceId");
      const limit = Number(searchParams.get("limit") || "20");

      if (!resourceType || !resourceId) {
        return NextResponse.json({ error: "resourceType and resourceId are required" }, { status: 400 });
      }

      const data = await prisma.activityLog.findMany({
        where: {
          resourceType,
          resourceId,
        },
        include: {
          user: {
            select: { id: true, fullName: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      return NextResponse.json(
        {
          data: data.map((item) => ({
            id: item.id,
            action: item.action,
            details: item.details,
            created_at: item.createdAt,
            users: {
              id: item.user.id,
              full_name: item.user.fullName,
              email: item.user.email,
            },
          })),
          error: null,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed to process activity logs request" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body?.action as string | undefined;

    if (action === "create") {
      const data = await prisma.activityLog.create({
        data: {
          teamId: body.log.team_id,
          userId: body.log.user_id,
          action: body.log.action,
          resourceType: body.log.resource_type,
          resourceId: body.log.resource_id,
          details: body.log.details as Prisma.InputJsonValue | undefined,
          ipAddress: body.log.ip_address,
          userAgent: body.log.user_agent,
        },
        select: { id: true, createdAt: true },
      });

      return NextResponse.json({ data: { id: data.id, created_at: data.createdAt }, error: null }, { status: 200 });
    }

    if (action === "batch-create") {
      const created = await Promise.all(
        (body.logs || []).map((log: Record<string, unknown>) =>
          prisma.activityLog.create({
            data: {
              teamId: (log.team_id as string | null) ?? null,
              userId: String(log.user_id),
              action: String(log.action),
              resourceType: (log.resource_type as string | null) ?? null,
              resourceId: (log.resource_id as string | null) ?? null,
              details: log.details as Prisma.InputJsonValue | undefined,
              ipAddress: (log.ip_address as string | null) ?? null,
              userAgent: (log.user_agent as string | null) ?? null,
            },
            select: { id: true },
          })
        )
      );
      return NextResponse.json({ data: created, error: null }, { status: 200 });
    }

    if (action === "summary") {
      const from = body.dateFrom ? new Date(body.dateFrom) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const grouped = await prisma.activityLog.groupBy({
        by: ["action"],
        where: {
          teamId: body.teamId,
          createdAt: {
            gte: from,
          },
        },
        _count: {
          action: true,
        },
      });

      return NextResponse.json(
        {
          data: grouped.map((item) => ({
            action: item.action,
            count: item._count.action,
          })),
          error: null,
        },
        { status: 200 }
      );
    }

    if (action === "cleanup") {
      const result = await prisma.activityLog.deleteMany({
        where: {
          createdAt: {
            lt: new Date(body.cutoffDate),
          },
        },
      });
      return NextResponse.json({ data: { count: result.count }, error: null }, { status: 200 });
    }

    if (action === "performance") {
      const [total, last24h] = await Promise.all([
        prisma.activityLog.count(),
        prisma.activityLog.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);
      return NextResponse.json({ data: { total_logs: total, logs_last_24h: last24h }, error: null }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed to process activity logs request" }, { status: 500 });
  }
}
