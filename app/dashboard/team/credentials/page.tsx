import { TeamCredentialsSetup } from "@/components/team-credentials-setup"
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function TeamCredentialsPage() {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth")
  }

  // Get user's current team
  const { data: teamMember } = await supabase
    .from("team_members")
    .select(`
      team_id,
      role,
      teams(*)
    `)
    .eq("user_id", user.id)
    .single()

  if (!teamMember) {
    redirect("/dashboard")
  }

  const isOwner = teamMember.teams[0]?.owner_id === user.id

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Credentials</h1>
        <p className="text-muted-foreground">Set up shared exchange credentials for your team trading operations</p>
      </div>

      <TeamCredentialsSetup teamId={teamMember.team_id} isOwner={isOwner} />
    </div>
  )
}