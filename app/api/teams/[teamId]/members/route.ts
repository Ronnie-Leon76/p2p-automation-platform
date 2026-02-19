import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ teamId: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { teamId } = await params;
    const supabase = await createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: memberCheck, error: memberCheckError } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberCheckError) {
      return NextResponse.json({ error: memberCheckError.message }, { status: 500 });
    }

    if (!memberCheck) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("team_members")
      .select(
        `
          *,
          users:user_id (
            id,
            email,
            full_name,
            avatar_url
          )
        `
      )
      .eq("team_id", teamId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ members: data ?? [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 });
  }
}
