import { TeamCredentialsSetup } from "@/components/team-credentials-setup";
import { getAuthenticatedUser } from "@/lib/auth/server-user";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";

export default async function TeamCredentialsPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth");
  }

  const teamMember = await prisma.teamMember.findFirst({
    where: { userId: user.id },
    include: { team: { select: { ownerId: true } } },
  });

  if (!teamMember) {
    redirect("/dashboard");
  }

  const isOwner = teamMember.team.ownerId === user.id;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Credentials</h1>
        <p className="text-muted-foreground">
          Set up shared exchange credentials for your team trading operations
        </p>
      </div>

      <TeamCredentialsSetup teamId={teamMember.teamId} isOwner={isOwner} />
    </div>
  );
}

