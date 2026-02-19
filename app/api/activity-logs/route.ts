import { isPostgresAdapter } from "@/lib/composition/backend-adapter";
import { prisma } from "@/lib/db/prisma";
import { createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const usePostgres = isPostgresAdapter();
    const supabase = usePostgres ? null : await createServerClient();
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

      if (usePostgres) {
        const where: any = {
          userId,
        };
        if (dateFrom || dateTo) {
          where.createdAt = {};
          if (dateFrom) where.createdAt.gte = new Date(dateFrom);
          if (dateTo) where.createdAt.lte = new Date(dateTo);
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
            data: data.map((item) => ({
              id: item.id,
              action: item.action,
              resource_type: item.resourceType,
              resource_id: item.resourceId,
              details: item.details,
              created_at: item.createdAt,
              team_id: item.teamId,
            })),
            error: null,
            count,
          },
          { status: 200 }
        );
      }

      let query = supabase!
        .from("activity_logs")
        .select(
          `
            id,
            action,
            resource_type,
            resource_id,
            details,
            created_at,
            team_id
          `,
          { count: "exact" }
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (dateFrom) {
        query = query.gte("created_at", dateFrom);
      }
      if (dateTo) {
        query = query.lte("created_at", dateTo);
      }
      if (actions && actions.length > 0) {
        query = query.in("action", actions);
      }

      query = query.range(offset, offset + limit - 1);
      const { data, error, count } = await query;

      return NextResponse.json({ data, error, count }, { status: 200 });
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

      if (usePostgres) {
        const where: any = { teamId };
        if (userId) where.userId = userId;
        if (dateFrom || dateTo) {
          where.createdAt = {};
          if (dateFrom) where.createdAt.gte = new Date(dateFrom);
          if (dateTo) where.createdAt.lte = new Date(dateTo);
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
              id: item.id,
              action: item.action,
              resource_type: item.resourceType,
              resource_id: item.resourceId,
              details: item.details,
              created_at: item.createdAt,
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

      let query = supabase!
        .from("activity_logs")
        .select(
          `
            id,
            action,
            resource_type,
            resource_id,
            details,
            created_at,
            users!inner (
              id,
              full_name,
              email,
              avatar_url
            )
          `,
          { count: "exact" }
        )
        .eq("team_id", teamId)
        .order("created_at", { ascending: false });

      if (userId) {
        query = query.eq("user_id", userId);
      }
      if (dateFrom) {
        query = query.gte("created_at", dateFrom);
      }
      if (dateTo) {
        query = query.lte("created_at", dateTo);
      }

      query = query.range(offset, offset + limit - 1);
      const { data, error, count } = await query;
      return NextResponse.json({ data, error, count }, { status: 200 });
    }

    if (action === "resource") {
      const resourceType = searchParams.get("resourceType");
      const resourceId = searchParams.get("resourceId");
      const limit = Number(searchParams.get("limit") || "20");

      if (!resourceType || !resourceId) {
        return NextResponse.json({ error: "resourceType and resourceId are required" }, { status: 400 });
      }

      if (usePostgres) {
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

      const { data, error } = await supabase!
        .from("activity_logs")
        .select(
          `
            id,
            action,
            details,
            created_at,
            users!inner (
              id,
              full_name,
              email
            )
          `
        )
        .eq("resource_type", resourceType)
        .eq("resource_id", resourceId)
        .order("created_at", { ascending: false })
        .limit(limit);

      return NextResponse.json({ data, error }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process activity logs request" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body?.action as string | undefined;
    const usePostgres = isPostgresAdapter();
    const supabase = usePostgres ? null : await createServerClient();

    if (action === "create") {
      if (usePostgres) {
        const data = await prisma.activityLog.create({
          data: {
            teamId: body.log.team_id,
            userId: body.log.user_id,
            action: body.log.action,
            resourceType: body.log.resource_type,
            resourceId: body.log.resource_id,
            details: body.log.details,
            ipAddress: body.log.ip_address,
            userAgent: body.log.user_agent,
          },
          select: { id: true, createdAt: true },
        });
        return NextResponse.json({ data: { id: data.id, created_at: data.createdAt }, error: null }, { status: 200 });
      }

      const { data, error } = await supabase!
        .from("activity_logs")
        .insert([body.log])
        .select("id, created_at")
        .single();
      return NextResponse.json({ data, error }, { status: 200 });
    }

    if (action === "batch-create") {
      if (usePostgres) {
        const created = await Promise.all(
          (body.logs || []).map((log: any) =>
            prisma.activityLog.create({
              data: {
                teamId: log.team_id,
                userId: log.user_id,
                action: log.action,
                resourceType: log.resource_type,
                resourceId: log.resource_id,
                details: log.details,
                ipAddress: log.ip_address,
                userAgent: log.user_agent,
              },
              select: { id: true },
            })
          )
        );
        return NextResponse.json({ data: created, error: null }, { status: 200 });
      }

      const { data, error } = await supabase!.from("activity_logs").insert(body.logs).select("id");
      return NextResponse.json({ data, error }, { status: 200 });
    }

    if (action === "summary") {
      if (usePostgres) {
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

      const { data, error } = await supabase!.rpc("get_activity_summary", {
        team_id: body.teamId,
        date_from: body.dateFrom,
      });
      return NextResponse.json({ data, error }, { status: 200 });
    }

    if (action === "cleanup") {
      if (usePostgres) {
        const result = await prisma.activityLog.deleteMany({
          where: {
            createdAt: {
              lt: new Date(body.cutoffDate),
            },
          },
        });
        return NextResponse.json({ data: { count: result.count }, error: null }, { status: 200 });
      }

      const { data, error } = await supabase!.from("activity_logs").delete().lt("created_at", body.cutoffDate);
      return NextResponse.json({ data, error }, { status: 200 });
    }

    if (action === "performance") {
      if (usePostgres) {
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

      const { data, error } = await supabase!.rpc("get_performance_stats");
      return NextResponse.json({ data, error }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process activity logs request" }, { status: 500 });
  }
}
