import { createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: memberData, error: memberError } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id);

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    const teamIds = (memberData ?? []).map((item: { team_id: string }) => item.team_id);
    if (teamIds.length === 0) {
      return NextResponse.json({ teams: [] }, { status: 200 });
    }

    const { data: teamsData, error: teamsError } = await supabase.from("teams").select("*").in("id", teamIds);
    if (teamsError) {
      return NextResponse.json({ error: teamsError.message }, { status: 500 });
    }

    return NextResponse.json({ teams: teamsData ?? [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = body?.name as string | undefined;
    const description = body?.description as string | undefined;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 });
    }

    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: teamData, error: teamError } = await supabase
      .from("teams")
      .insert({
        name: name.trim(),
        description: description ?? null,
        owner_id: user.id,
      })
      .select("*")
      .single();

    if (teamError || !teamData) {
      return NextResponse.json({ error: teamError?.message ?? "Failed to create team" }, { status: 500 });
    }

    const { error: memberError } = await supabase.from("team_members").insert({
      team_id: teamData.id,
      user_id: user.id,
      role: "owner",
    });

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    return NextResponse.json({ team: teamData }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
  }
}
