import type { Team, TeamInvitation, TeamMember, TeamServiceInterface } from '../interfaces/team-service';
import { supabase } from './supabase-client';

// Database to TypeScript mapping for teams
interface DbTeam {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface DbTeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  permissions: any;
  invited_by?: string;
  joined_at: string;
}

export class SupabaseTeamService implements TeamServiceInterface {

  // Convert database team record to TypeScript interface
  private async dbToTeam(dbTeam: DbTeam): Promise<Team> {
    // Get team members
    const { data: membersData } = await supabase
      .from('team_members')
      .select(`
        id, user_id, role, permissions, joined_at,
        users!inner(id, full_name, email, avatar_url)
      `)
      .eq('team_id', dbTeam.id);

    const members = (membersData || []).map((member: any) => ({
      id: member.id,
      name: member.users.full_name || member.users.email,
      email: member.users.email,
      avatar: member.users.avatar_url || '/placeholder-user.jpg',
      role: member.role as "owner" | "admin" | "manager" | "operator",
      permissions: Array.isArray(member.permissions) ? member.permissions : [],
      joinedAt: member.joined_at,
      isActive: true,
      lastActive: new Date().toISOString(),
    }));

    // Find owner
    const owner = members.find(m => m.role === 'owner') || members[0];

    return {
      id: dbTeam.id,
      name: dbTeam.name,
      description: dbTeam.description || '',
      owner: owner || {
        id: '',
        name: 'Unknown',
        email: '',
        avatar: '/placeholder-user.jpg',
        role: 'owner',
        permissions: [],
        joinedAt: dbTeam.created_at,
        isActive: true,
        lastActive: new Date().toISOString(),
      },
      members,
      exchanges: {
        okx: { connected: false },
        binance: { connected: false },
        bybit: { connected: false },
      },
      createdAt: dbTeam.created_at,
      isActive: true, // Add the missing isActive property
      totalAds: 0, // Will be calculated separately if needed
      activeAds: 0,
      totalVolume: '0',
    };
  }

  // Convert TypeScript team to database record
  private teamToDb(team: Partial<Team>, ownerId?: string): Partial<DbTeam> {
    return {
      name: team.name,
      description: team.description,
      owner_id: ownerId || team.owner?.id,
      updated_at: new Date().toISOString(),
    };
  }

  async getAllTeams(): Promise<Team[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching teams:', error);
        return [];
      }

      const teams = await Promise.all((data || []).map(this.dbToTeam.bind(this)));
      return teams;
    } catch (error) {
      console.error('Unexpected error in getAllTeams:', error);
      return [];
    }
  }

  async getTeamById(id: string): Promise<Team | null> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching team by ID:', error);
        return null;
      }

      return data ? await this.dbToTeam(data) : null;
    } catch (error) {
      console.error('Unexpected error in getTeamById:', error);
      return null;
    }
  }

  async getUserTeams(userId: string): Promise<Team[]> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          teams(*)
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user teams:', error);
        return [];
      }

      const teamData = (data || [])
        .map((item: any) => item.teams)
        .filter(Boolean);
        
      const teams = await Promise.all(teamData.map(this.dbToTeam.bind(this)));
      return teams;
    } catch (error) {
      console.error('Unexpected error in getUserTeams:', error);
      return [];
    }
  }

  async createTeam(teamData: {
    name: string;
    description?: string;
    owner_id: string;
  }): Promise<Team> {
    try {
      // Create the team
      const dbData = this.teamToDb(teamData, teamData.owner_id);
      dbData.created_at = new Date().toISOString();

      const { data: teamData_db, error: teamError } = await supabase
        .from('teams')
        .insert([dbData])
        .select()
        .single();

      if (teamError) {
        console.error('Error creating team:', teamError);
        throw new Error(`Failed to create team: ${teamError.message}`);
      }

      // Add owner as team member
      const { error: memberError } = await supabase
        .from('team_members')
        .insert([{
          team_id: teamData_db.id,
          user_id: teamData.owner_id,
          role: 'owner',
          permissions: {},
        }]);

      if (memberError) {
        console.error('Error adding team owner:', memberError);
        // Try to clean up the team if member creation failed
        await supabase.from('teams').delete().eq('id', teamData_db.id);
        throw new Error(`Failed to add team owner: ${memberError.message}`);
      }

      return await this.dbToTeam(teamData_db);
    } catch (error) {
      console.error('Unexpected error in createTeam:', error);
      throw error;
    }
  }

  async updateTeam(id: string, teamData: Partial<Team>): Promise<Team | null> {
    try {
      const dbData = this.teamToDb(teamData);

      const { data, error } = await supabase
        .from('teams')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating team:', error);
        return null;
      }

      return data ? await this.dbToTeam(data) : null;
    } catch (error) {
      console.error('Unexpected error in updateTeam:', error);
      return null;
    }
  }

  async deleteTeam(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting team:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error in deleteTeam:', error);
      return false;
    }
  }

  // Team member management
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          users!inner(id, full_name, email, avatar_url)
        `)
        .eq('team_id', teamId);

      if (error) {
        console.error('Error fetching team members:', error);
        return [];
      }

      return (data || []).map((member: any) => ({
        id: member.id,
        user_id: member.user_id,
        team_id: member.team_id,
        role: member.role,
        permissions: Array.isArray(member.permissions) ? member.permissions : [],
        invited_by: member.invited_by,
        joined_at: member.joined_at,
        user: {
          id: member.users.id,
          full_name: member.users.full_name || member.users.email,
          email: member.users.email,
          avatar_url: member.users.avatar_url,
        },
      }));
    } catch (error) {
      console.error('Unexpected error in getTeamMembers:', error);
      return [];
    }
  }

  async addTeamMember(teamId: string, userId: string, role: string = 'member'): Promise<TeamMember | null> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .insert([{
          team_id: teamId,
          user_id: userId,
          role,
          permissions: {},
        }])
        .select(`
          *,
          users!inner(id, full_name, email, avatar_url)
        `)
        .single();

      if (error) {
        console.error('Error adding team member:', error);
        return null;
      }

      return {
        id: data.id,
        user_id: data.user_id,
        team_id: data.team_id,
        role: data.role,
        permissions: Array.isArray(data.permissions) ? data.permissions : [],
        invited_by: data.invited_by,
        joined_at: data.joined_at,
        user: {
          id: data.users.id,
          full_name: data.users.full_name || data.users.email,
          email: data.users.email,
          avatar_url: data.users.avatar_url,
        },
      };
    } catch (error) {
      console.error('Unexpected error in addTeamMember:', error);
      return null;
    }
  }

  async removeTeamMember(teamId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing team member:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error in removeTeamMember:', error);
      return false;
    }
  }

  async updateTeamMemberRole(teamId: string, userId: string, role: string): Promise<TeamMember | null> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .update({ role })
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .select(`
          *,
          users!inner(id, full_name, email, avatar_url)
        `)
        .single();

      if (error) {
        console.error('Error updating team member role:', error);
        return null;
      }

      return {
        id: data.id,
        user_id: data.user_id,
        team_id: data.team_id,
        role: data.role,
        permissions: Array.isArray(data.permissions) ? data.permissions : [],
        invited_by: data.invited_by,
        joined_at: data.joined_at,
        user: {
          id: data.users.id,
          full_name: data.users.full_name || data.users.email,
          email: data.users.email,
          avatar_url: data.users.avatar_url,
        },
      };
    } catch (error) {
      console.error('Unexpected error in updateTeamMemberRole:', error);
      return null;
    }
  }

  async getTeamsByUser(userId: string): Promise<Team[]> {
    // Alias for getUserTeams to match interface
    return this.getUserTeams(userId);
  }

  async updateMemberRole(teamId: string, userId: string, role: string): Promise<TeamMember | null> {
    // Alias for updateTeamMemberRole to match interface
    return this.updateTeamMemberRole(teamId, userId, role);
  }

  // Invitation system (simplified implementations)
  async getTeamInvitations(teamId: string): Promise<TeamInvitation[]> {
    // This would require a team_invitations table
    // For now, return empty array
    return [];
  }

  async inviteUserByEmail(teamId: string, email: string, role: string, invitedBy: string): Promise<TeamInvitation> {
    // This would require a team_invitations table
    // For now, return a mock invitation
    const invitation: TeamInvitation = {
      id: `invite_${Date.now()}`,
      team_id: teamId,
      email,
      role,
      invited_by: invitedBy,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    };
    return invitation;
  }

  async getUserInvitations(email: string): Promise<TeamInvitation[]> {
    // This would require a team_invitations table
    return [];
  }

  async acceptInvitation(invitationId: string, userId: string): Promise<boolean> {
    // This would require a team_invitations table
    return false;
  }

  async declineInvitation(invitationId: string): Promise<boolean> {
    // This would require a team_invitations table
    return false;
  }

  // Permissions
  async checkUserPermission(userId: string, teamId: string, permission: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('role, permissions')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .single();

      if (error || !data) return false;

      // Simple permission check - owners and admins have all permissions
      if (data.role === 'owner' || data.role === 'admin') return true;

      // Check specific permissions
      const permissions = Array.isArray(data.permissions) ? data.permissions : [];
      return permissions.includes(permission);
    } catch (error) {
      console.error('Error checking user permission:', error);
      return false;
    }
  }

  async getUserRole(userId: string, teamId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .single();

      if (error || !data) return null;
      return data.role;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }

  async getTeamStats(teamId: string): Promise<{
    memberCount: number;
    activeAds: number;
    totalVolume: number;
    lastActivity: string;
  }> {
    try {
      // Get member count
      const { count: memberCount } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId);

      // Get ad counts
      const { data: adData } = await supabase
        .from('ads')
        .select('status')
        .eq('team_id', teamId);

      const activeAds = adData?.filter(ad => ad.status === 'active').length || 0;

      return {
        memberCount: memberCount || 0,
        activeAds,
        totalVolume: 0, // Would need orders table to calculate
        lastActivity: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Unexpected error in getTeamStats:', error);
      return {
        memberCount: 0,
        activeAds: 0,
        totalVolume: 0,
        lastActivity: new Date().toISOString(),
      };
    }
  }
}
