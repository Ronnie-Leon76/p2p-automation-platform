"use client"

import { useEffect, useState } from "react"
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

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchTeams = async () => {
      try {
        const response = await fetch("/api/teams", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        })
        const payload = await response.json()
        if (!response.ok) {
          throw new Error(payload?.error || "Failed to fetch teams")
        }
        const teamsData = (payload?.teams || []) as Team[]

        setTeams(teamsData)
        if (!currentTeam && teamsData.length > 0) {
          setCurrentTeam(teamsData[0])
        }
      } catch (error) {
        console.error("Error fetching teams:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTeams()
  }, [user])

  useEffect(() => {
    if (!currentTeam) return

    const fetchTeamMembers = async () => {
      try {
        const response = await fetch(`/api/teams/${currentTeam.id}/members`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        })
        const payload = await response.json()
        if (!response.ok) {
          throw new Error(payload?.error || "Failed to fetch team members")
        }
        setTeamMembers(payload?.members || [])
      } catch (error) {
        console.error("Error fetching team members:", error)
      }
    }

    fetchTeamMembers()
  }, [currentTeam])

  const createTeam = async (name: string, description?: string) => {
    if (!user) return null

    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to create team")
      }
      const teamData = payload.team as Team

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

