"use client"

import { useEffect, useState } from "react"
import { getBrowserDbClient } from "@/lib/composition/browser-db-composer";
import { useAuth } from "./use-auth"

interface Team {
  id: string
  name: string
  description: string | null
  owner_id: string
  created_at: string
  updated_at: string
}

interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: string
  permissions: any
  invited_by: string | null
  joined_at: string
}

export function useTeam() {
  const [teams, setTeams] = useState<Team[]>([])
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = getBrowserDbClient()

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchTeams = async () => {
      try {
        // Get teams where user is a member
        const { data: memberData, error: memberError } = await supabase
          .from("team_members")
          .select("team_id")
          .eq("user_id", user.id)

        if (memberError) throw memberError

        const teamIds = memberData.map((m) => m.team_id)

        if (teamIds.length > 0) {
          const { data: teamsData, error: teamsError } = await supabase.from("teams").select("*").in("id", teamIds)

          if (teamsError) throw teamsError

          setTeams(teamsData || [])

          // Set first team as current if none selected
          if (!currentTeam && teamsData && teamsData.length > 0) {
            setCurrentTeam(teamsData[0])
          }
        }
      } catch (error) {
        console.error("Error fetching teams:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTeams()
  }, [user, supabase])

  useEffect(() => {
    if (!currentTeam) return

    const fetchTeamMembers = async () => {
      try {
        const { data, error } = await supabase
          .from("team_members")
          .select(`
            *,
            users:user_id (
              id,
              email,
              full_name,
              avatar_url
            )
          `)
          .eq("team_id", currentTeam.id)

        if (error) throw error
        setTeamMembers(data || [])
      } catch (error) {
        console.error("Error fetching team members:", error)
      }
    }

    fetchTeamMembers()
  }, [currentTeam, supabase])

  const createTeam = async (name: string, description?: string) => {
    if (!user) return null

    try {
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .insert({
          name,
          description,
          owner_id: user.id,
        })
        .select()
        .single()

      if (teamError) throw teamError

      // Add creator as team member
      const { error: memberError } = await supabase.from("team_members").insert({
        team_id: teamData.id,
        user_id: user.id,
        role: "owner",
      })

      if (memberError) throw memberError

      setTeams((prev) => [...prev, teamData])
      setCurrentTeam(teamData)

      return teamData
    } catch (error) {
      console.error("Error creating team:", error)
      return null
    }
  }

  const switchTeam = (team: Team) => {
    setCurrentTeam(team)
  }

  return {
    teams,
    currentTeam,
    teamMembers,
    loading,
    createTeam,
    switchTeam,
  }
}

