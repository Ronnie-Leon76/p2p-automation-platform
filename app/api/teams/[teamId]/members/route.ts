import { getAuthenticatedUser } from "@/lib/auth/server-user";
import { prisma } from "@/lib/db/prisma";
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
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 });
  }
}
