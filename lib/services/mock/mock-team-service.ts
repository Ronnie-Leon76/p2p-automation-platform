import { MockInvitationStorage } from '@/lib/auth/mock-invitation-storage';
import { MockTeamStorage } from '@/lib/auth/mock-team-storage';
import type { Team, TeamInvitation, TeamMember, TeamServiceInterface } from '../interfaces/team-service';

export class MockTeamService implements TeamServiceInterface {
  private teamStorage: MockTeamStorage;
  private invitationStorage: MockInvitationStorage;

  constructor() {
    this.teamStorage = MockTeamStorage.getInstance();
    this.invitationStorage = MockInvitationStorage.getInstance();
  }

  async getAllTeams(): Promise<Team[]> {
    return this.teamStorage.getAllTeams();
  }

  async getTeamById(id: string): Promise<Team | null> {
    const teams = this.teamStorage.getAllTeams();
    return teams.find(team => team.id === id) || null;
  }

  async getTeamsByUser(userId: string): Promise<Team[]> {
    const ownerTeams = this.teamStorage.getTeamsByOwner(userId);
    const memberTeams = this.teamStorage.getTeamsByMember(userId);
    return [...ownerTeams, ...memberTeams];
  }

  async getUserTeams(userId: string): Promise<Team[]> {
    return this.getTeamsByUser(userId);
  }

  async createTeam(teamData: {
    name: string;
    description?: string;
    owner_id: string;
  }): Promise<Team> {
    // For mock implementation, we need owner details
    // In real implementation, we'd fetch from user service
    return this.teamStorage.addTeam(
      {
        name: teamData.name,
        description: teamData.description || '',
      },
      teamData.owner_id,
      'Mock User', // Would be fetched from user service
      'user@example.com' // Would be fetched from user service
    );
  }

  async updateTeam(id: string, teamData: Partial<Team>): Promise<Team | null> {
    return this.teamStorage.updateTeam(id, teamData as any);
  }

  async deleteTeam(id: string): Promise<boolean> {
    return this.teamStorage.deleteTeam(id);
  }

  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    const team = await this.getTeamById(teamId);
    if (!team) return [];

    const members: TeamMember[] = [];
    
    // Add owner
    members.push({
      id: `${teamId}-${team.owner.id}`,
      user_id: team.owner.id,
      team_id: teamId,
      role: 'owner',
      permissions: ['read', 'write', 'admin'],
      joined_at: team.createdAt,
      user: {
        id: team.owner.id,
        full_name: team.owner.name,
        email: team.owner.email,
        avatar_url: team.owner.avatar,
      },
    });

    // Add members
    team.members.forEach(member => {
      members.push({
        id: `${teamId}-${member.id}`,
        user_id: member.id,
        team_id: teamId,
        role: 'member',
        permissions: ['read', 'write'],
        joined_at: member.joinedAt,
        user: {
          id: member.id,
          full_name: member.name,
          email: member.email,
          avatar_url: member.avatar,
        },
      });
    });

    return members;
  }

  async addTeamMember(teamId: string, userId: string, role: string = 'member'): Promise<TeamMember | null> {
    const success = this.teamStorage.joinTeam(teamId, userId, 'Mock User', 'user@example.com');
    if (!success) return null;

    return {
      id: `${teamId}-${userId}`,
      user_id: userId,
      team_id: teamId,
      role: role as 'owner' | 'admin' | 'member' | 'viewer',
      permissions: role === 'admin' ? ['read', 'write', 'admin'] : ['read', 'write'],
      joined_at: new Date().toISOString(),
    };
  }

  async removeTeamMember(teamId: string, userId: string): Promise<boolean> {
    // Mock implementation - would need owner ID in real implementation
    return this.teamStorage.removeMember(teamId, userId, 'mock-owner-id');
  }

  async updateMemberRole(teamId: string, userId: string, role: string): Promise<TeamMember | null> {
    // Mock implementation - in real app this would update database
    const members = await this.getTeamMembers(teamId);
    const existingMember = members.find(m => m.user_id === userId);
    if (!existingMember) return null;

    return {
      ...existingMember,
      role: role as 'owner' | 'admin' | 'member' | 'viewer',
      permissions: role === 'admin' ? ['read', 'write', 'admin'] : ['read', 'write'],
    };
  }

  async inviteUserByEmail(teamId: string, email: string, role: string, invitedBy: string): Promise<TeamInvitation> {
    const invitation = this.invitationStorage.createInvitation(
      teamId,
      'Mock Team',
      invitedBy,
      'Mock Inviter',
      email,
      role as 'admin' | 'manager' | 'operator',
      ['read', 'write'],
      true
    );

    return {
      id: invitation.id,
      team_id: invitation.teamId,
      email: invitation.inviteeEmail,
      role: invitation.role,
      invited_by: invitation.inviterUserId,
      created_at: invitation.createdAt,
      expires_at: invitation.expiresAt,
      status: invitation.status as 'pending' | 'accepted' | 'declined' | 'expired',
    };
  }

  async getTeamInvitations(teamId: string): Promise<TeamInvitation[]> {
    const invitations = this.invitationStorage.getInvitationsByTeam(teamId);
    return invitations.map(inv => ({
      id: inv.id,
      team_id: inv.teamId,
      email: inv.inviteeEmail,
      role: inv.role,
      invited_by: inv.inviterUserId,
      created_at: inv.createdAt,
      expires_at: inv.expiresAt,
      status: inv.status as 'pending' | 'accepted' | 'declined' | 'expired',
    }));
  }

  async getUserInvitations(email: string): Promise<TeamInvitation[]> {
    const invitations = this.invitationStorage.getInvitationsByEmail(email);
    return invitations.map(inv => ({
      id: inv.id,
      team_id: inv.teamId,
      email: inv.inviteeEmail,
      role: inv.role,
      invited_by: inv.inviterUserId,
      created_at: inv.createdAt,
      expires_at: inv.expiresAt,
      status: inv.status as 'pending' | 'accepted' | 'declined' | 'expired',
    }));
  }

  async acceptInvitation(invitationId: string, userId: string): Promise<boolean> {
    const invitation = this.invitationStorage.acceptInvitation(invitationId);
    if (!invitation) return false;

    // Add user to team
    const success = this.teamStorage.joinTeam(invitation.teamId, userId, 'Mock User', invitation.inviteeEmail);
    return success;
  }

  async declineInvitation(invitationId: string): Promise<boolean> {
    return this.invitationStorage.declineInvitation(invitationId);
  }

  async checkUserPermission(userId: string, teamId: string, permission: string): Promise<boolean> {
    const members = await this.getTeamMembers(teamId);
    const member = members.find(m => m.user_id === userId);
    return member?.permissions.includes(permission) || false;
  }

  async getUserRole(userId: string, teamId: string): Promise<string | null> {
    const members = await this.getTeamMembers(teamId);
    const member = members.find(m => m.user_id === userId);
    return member?.role || null;
  }

  async getTeamStats(teamId: string): Promise<{
    memberCount: number;
    activeAds: number;
    totalVolume: number;
    lastActivity: string;
  }> {
    const members = await this.getTeamMembers(teamId);
    const team = await this.getTeamById(teamId);
    
    return {
      memberCount: members.length,
      activeAds: team?.activeAds || 0,
      totalVolume: parseFloat(team?.totalVolume?.replace(/,/g, '') || '0'),
      lastActivity: new Date().toISOString(),
    };
  }
}
