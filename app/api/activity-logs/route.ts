import { createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
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

      let query = supabase
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

      let query = supabase
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

      const { data, error } = await supabase
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
    const supabase = await createServerClient();

    if (action === "create") {
      const { data, error } = await supabase
        .from("activity_logs")
        .insert([body.log])
        .select("id, created_at")
        .single();
      return NextResponse.json({ data, error }, { status: 200 });
    }

    if (action === "batch-create") {
      const { data, error } = await supabase.from("activity_logs").insert(body.logs).select("id");
      return NextResponse.json({ data, error }, { status: 200 });
    }

    if (action === "summary") {
      const { data, error } = await supabase.rpc("get_activity_summary", {
        team_id: body.teamId,
        date_from: body.dateFrom,
      });
      return NextResponse.json({ data, error }, { status: 200 });
    }

    if (action === "cleanup") {
      const { data, error } = await supabase.from("activity_logs").delete().lt("created_at", body.cutoffDate);
      return NextResponse.json({ data, error }, { status: 200 });
    }

    if (action === "performance") {
      const { data, error } = await supabase.rpc("get_performance_stats");
      return NextResponse.json({ data, error }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process activity logs request" }, { status: 500 });
  }
}
