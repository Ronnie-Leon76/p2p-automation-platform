import { getAuthenticatedUser } from "@/lib/auth/server-user";
import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberships = await prisma.teamMember.findMany({
      where: { userId: user.id },
      select: { teamId: true },
    });
    const teamIds = memberships.map((item) => item.teamId);
    if (teamIds.length === 0) {
      return NextResponse.json({ teams: [] }, { status: 200 });
    }

    const teams = await prisma.team.findMany({
      where: { id: { in: teamIds } },
    });

    return NextResponse.json(
      {
        teams: teams.map((team) => ({
          id: team.id,
          name: team.name,
          description: team.description,
          owner_id: team.ownerId,
          created_at: team.createdAt,
          updated_at: team.updatedAt,
        })),
      },
      { status: 200 }
    );
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

    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.appUser.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email,
        fullName: user.user_metadata?.full_name ?? null,
        userType: user.user_metadata?.user_type ?? "merchant",
        profileComplete: false,
      },
      update: {
        email: user.email,
        fullName: user.user_metadata?.full_name ?? undefined,
        userType: user.user_metadata?.user_type ?? undefined,
      },
    });

    const teamData = await prisma.team.create({
      data: {
        name: name.trim(),
        description: description ?? null,
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
            role: "owner",
          },
        },
      },
    });

    return NextResponse.json(
      {
        team: {
          id: teamData.id,
          name: teamData.name,
          description: teamData.description,
          owner_id: teamData.ownerId,
          created_at: teamData.createdAt,
          updated_at: teamData.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
  }
}

