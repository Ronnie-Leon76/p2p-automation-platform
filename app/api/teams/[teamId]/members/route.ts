import { getAuthenticatedUser } from "@/lib/auth/server-user";
import { isPostgresAdapter } from "@/lib/composition/backend-adapter";
import { prisma } from "@/lib/db/prisma";
import { createServerClient } from "@/lib/database/server-client";
import { NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ teamId: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { teamId } = await params;
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isPostgresAdapter()) {
      const memberCheck = await prisma.teamMember.findFirst({
        where: {
          teamId,
          userId: user.id,
        },
        select: { id: true },
      });

      if (!memberCheck) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const members = await prisma.teamMember.findMany({
        where: { teamId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
      });

      return NextResponse.json(
        {
          members: members.map((member) => ({
            id: member.id,
            team_id: member.teamId,
            user_id: member.userId,
            role: member.role,
            permissions: member.permissions,
            invited_by: member.invitedBy,
            joined_at: member.joinedAt,
            users: {
              id: member.user.id,
              email: member.user.email,
              full_name: member.user.fullName,
              avatar_url: null,
            },
          })),
        },
        { status: 200 }
      );
    }

    const supabase = await createServerClient();
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
