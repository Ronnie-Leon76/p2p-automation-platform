export interface TeamPerson {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'owner' | 'admin' | 'manager' | 'operator' | 'member' | 'viewer';
  permissions: string[];
  joinedAt: string;
  isActive: boolean;
  lastActive: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  owner: TeamPerson;
  members: TeamPerson[];
  exchanges: {
    okx: { connected: boolean; accountId?: string };
    binance: { connected: boolean; accountId?: string };
    bybit: { connected: boolean; accountId?: string };
  };
  createdAt: string;
  totalAds: number;
  activeAds: number;
  totalVolume: string;
  isActive: boolean;
}

export interface TeamMember {
  id: string;
  user_id: string;
  team_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions: string[];
  invited_by?: string;
  joined_at: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role: string;
  invited_by: string;
  created_at: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

export interface TeamServiceInterface {
  // Basic CRUD operations
  getAllTeams(): Promise<Team[]>;
  getTeamById(id: string): Promise<Team | null>;
  getTeamsByUser(userId: string): Promise<Team[]>;
  getUserTeams(userId: string): Promise<Team[]>;
  
  // Team operations
  createTeam(teamData: {
    name: string;
    description?: string;
    owner_id: string;
  }): Promise<Team>;
  
  updateTeam(id: string, teamData: Partial<Team>): Promise<Team | null>;
  deleteTeam(id: string): Promise<boolean>;
  
  // Member management
  getTeamMembers(teamId: string): Promise<TeamMember[]>;
  addTeamMember(teamId: string, userId: string, role?: string): Promise<TeamMember | null>;
  removeTeamMember(teamId: string, userId: string): Promise<boolean>;
  updateMemberRole(teamId: string, userId: string, role: string): Promise<TeamMember | null>;
  
  // Invitation system
  inviteUserByEmail(teamId: string, email: string, role: string, invitedBy: string): Promise<TeamInvitation>;
  getTeamInvitations(teamId: string): Promise<TeamInvitation[]>;
  getUserInvitations(email: string): Promise<TeamInvitation[]>;
  acceptInvitation(invitationId: string, userId: string): Promise<boolean>;
  declineInvitation(invitationId: string): Promise<boolean>;
  
  // Permissions
  checkUserPermission(userId: string, teamId: string, permission: string): Promise<boolean>;
  getUserRole(userId: string, teamId: string): Promise<string | null>;
  
  // Statistics
  getTeamStats(teamId: string): Promise<{
    memberCount: number;
    activeAds: number;
    totalVolume: number;
    lastActivity: string;
  }>;
  
  // Real-time subscriptions (for Supabase)
  subscribeToTeamChanges?(teamId: string, callback: (team: Team) => void): () => void;
  subscribeToTeamMembers?(teamId: string, callback: (members: TeamMember[]) => void): () => void;
}
