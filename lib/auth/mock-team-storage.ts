/**
 * Mock Team Storage Service for Development
 * Provides localStorage-based team persistence for development and testing
 */

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: "owner" | "admin" | "manager" | "operator";
  permissions: string[];
  joinedAt: string;
  isActive: boolean;
  lastActive: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  owner: TeamMember;
  members: TeamMember[];
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

export class MockTeamStorage {
  private static instance: MockTeamStorage;
  private storageKey = 'mock_teams_data';

  static getInstance(): MockTeamStorage {
    if (!MockTeamStorage.instance) {
      MockTeamStorage.instance = new MockTeamStorage();
    }
    return MockTeamStorage.instance;
  }

  /**
   * Default mock teams for initial state
   */
  private defaultTeams: Team[] = [
    {
      id: "team-1",
      name: "OKX Trading Squad",
      description: "Professional P2P trading team focused on OKX markets",
      owner: {
        id: "mock-user-1",
        name: "John Trader",
        email: "trader1@example.com",
        avatar: "https://res.cloudinary.com/daqr2zwhj/image/upload/v1749292046/placeholder-user.jpg",
        role: "owner",
        permissions: ["create_ads", "manage_team", "view_analytics", "handle_disputes"],
        joinedAt: "2024-01-15T10:00:00Z",
        isActive: true,
        lastActive: new Date().toISOString(),
      },
      members: [
        {
          id: "member-1",
          name: "Alice Chen",
          email: "alice@example.com",
          avatar: "https://res.cloudinary.com/daqr2zwhj/image/upload/v1749292046/placeholder-user.jpg",
          role: "admin",
          permissions: ["create_ads", "manage_orders", "view_analytics"],
          joinedAt: "2024-01-20T14:30:00Z",
          isActive: true,
          lastActive: "2024-02-10T09:15:00Z",
        },
        {
          id: "member-2",
          name: "Bob Wilson",
          email: "bob@example.com",
          avatar: "https://res.cloudinary.com/daqr2zwhj/image/upload/v1749292046/placeholder-user.jpg",
          role: "operator",
          permissions: ["manage_orders", "handle_disputes"],
          joinedAt: "2024-02-01T11:45:00Z",
          isActive: true,
          lastActive: "2024-02-09T16:20:00Z",
        },
      ],
      exchanges: {
        okx: { connected: true, accountId: "okx_team_001" },
        binance: { connected: false },
        bybit: { connected: false },
      },
      createdAt: "2024-01-15T10:00:00Z",
      totalAds: 12,
      activeAds: 8,
      totalVolume: "2,450,000",
      isActive: true,
    },
    {
      id: "team-2",
      name: "Binance Elite",
      description: "High-volume Binance P2P specialists",
      owner: {
        id: "mock-user-2",
        name: "Jane Smith",
        email: "trader2@example.com",
        avatar: "https://res.cloudinary.com/daqr2zwhj/image/upload/v1749292046/placeholder-user.jpg",
        role: "owner",
        permissions: ["create_ads", "manage_team", "view_analytics", "handle_disputes"],
        joinedAt: "2024-01-10T08:00:00Z",
        isActive: true,
        lastActive: new Date().toISOString(),
      },
      members: [],
      exchanges: {
        okx: { connected: false },
        binance: { connected: true, accountId: "binance_team_001" },
        bybit: { connected: false },
      },
      createdAt: "2024-01-10T08:00:00Z",
      totalAds: 6,
      activeAds: 4,
      totalVolume: "1,200,000",
      isActive: true,
    }
  ];

  /**
   * Get all teams from localStorage or return defaults
   */
  getAllTeams(): Team[] {
    if (typeof window === 'undefined') {
      return this.defaultTeams;
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load teams from localStorage:', error);
    }

    // Return defaults and save them
    this.saveTeams(this.defaultTeams);
    return this.defaultTeams;
  }

  /**
   * Save teams to localStorage
   */
  saveTeams(teams: Team[]): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(teams));
      console.log(`💾 Saved ${teams.length} teams to localStorage`);
    } catch (error) {
      console.error('Failed to save teams to localStorage:', error);
    }
  }

  /**
   * Add a new team
   */
  addTeam(teamData: Partial<Team>, ownerId: string, ownerName: string, ownerEmail: string): Team {
    const teams = this.getAllTeams();
    
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name: teamData.name || 'Untitled Team',
      description: teamData.description || '',
      owner: {
        id: ownerId,
        name: ownerName,
        email: ownerEmail,
        avatar: "https://res.cloudinary.com/daqr2zwhj/image/upload/v1749292046/placeholder-user.jpg",
        role: "owner",
        permissions: ["create_ads", "manage_team", "view_analytics", "handle_disputes"],
        joinedAt: new Date().toISOString(),
        isActive: true,
        lastActive: new Date().toISOString(),
      },
      members: [],
      exchanges: {
        okx: { connected: false },
        binance: { connected: false },
        bybit: { connected: false },
      },
      createdAt: new Date().toISOString(),
      totalAds: 0,
      activeAds: 0,
      totalVolume: "0",
      isActive: true,
    };

    const updatedTeams = [...teams, newTeam];
    this.saveTeams(updatedTeams);
    
    console.log(`✅ Created new team: ${newTeam.name} (ID: ${newTeam.id})`);
    return newTeam;
  }

  /**
   * Update an existing team
   */
  updateTeam(teamId: string, updates: Partial<Team>): Team | null {
    const teams = this.getAllTeams();
    const teamIndex = teams.findIndex(t => t.id === teamId);
    
    if (teamIndex === -1) {
      console.error(`Team with ID ${teamId} not found`);
      return null;
    }

    const updatedTeam = { ...teams[teamIndex], ...updates };
    teams[teamIndex] = updatedTeam;
    
    this.saveTeams(teams);
    console.log(`📝 Updated team: ${updatedTeam.name}`);
    return updatedTeam;
  }

  /**
   * Delete a team
   */
  deleteTeam(teamId: string): boolean {
    const teams = this.getAllTeams();
    const filteredTeams = teams.filter(t => t.id !== teamId);
    
    if (filteredTeams.length === teams.length) {
      console.error(`Team with ID ${teamId} not found`);
      return false;
    }

    this.saveTeams(filteredTeams);
    console.log(`🗑️ Deleted team with ID: ${teamId}`);
    return true;
  }

  /**
   * Get teams owned by a specific user
   */
  getTeamsByOwner(ownerId: string): Team[] {
    const teams = this.getAllTeams();
    return teams.filter(team => team.owner.id === ownerId);
  }

  /**
   * Get teams where user is a member (not owner)
   */
  getTeamsByMember(userId: string): Team[] {
    const teams = this.getAllTeams();
    return teams.filter(team => 
      team.owner.id !== userId && 
      team.members.some(member => member.id === userId)
    );
  }

  /**
   * Join a team as a member
   */
  joinTeam(teamId: string, userId: string, userName: string, userEmail: string): boolean {
    const teams = this.getAllTeams();
    const team = teams.find(t => t.id === teamId);
    
    if (!team) {
      console.error(`Team with ID ${teamId} not found`);
      return false;
    }

    // Check if user is already a member or owner
    if (team.owner.id === userId || team.members.some(m => m.id === userId)) {
      console.warn(`User ${userId} is already part of team ${teamId}`);
      return false;
    }

    const newMember: TeamMember = {
      id: userId,
      name: userName,
      email: userEmail,
      avatar: "https://res.cloudinary.com/daqr2zwhj/image/upload/v1749292046/placeholder-user.jpg",
      role: "operator",
      permissions: ["manage_orders", "handle_disputes"],
      joinedAt: new Date().toISOString(),
      isActive: true,
      lastActive: new Date().toISOString(),
    };

    team.members.push(newMember);
    this.saveTeams(teams);
    
    console.log(`👥 User ${userName} joined team ${team.name}`);
    return true;
  }

  /**
   * Remove a team member (owner only)
   */
  removeMember(teamId: string, memberId: string, ownerId: string): boolean {
    const teams = this.getAllTeams();
    const team = teams.find(t => t.id === teamId);

    if (!team) {
      console.error('Team not found');
      return false;
    }

    if (team.owner.id !== ownerId) {
      console.error('Only team owner can remove members');
      return false;
    }

    const memberIndex = team.members.findIndex(m => m.id === memberId);
    if (memberIndex === -1) {
      console.error('Member not found in team');
      return false;
    }

    const removedMember = team.members[memberIndex];
    team.members.splice(memberIndex, 1);

    this.saveTeams(teams);
    console.log(`🚫 Removed member ${removedMember.name} from team ${team.name}`);
    return true;
  }

  /**
   * Update team member role and permissions (owner only)
   */
  updateMemberRole(
    teamId: string, 
    memberId: string, 
    newRole: "admin" | "manager" | "operator",
    newPermissions: string[],
    ownerId: string
  ): boolean {
    const teams = this.getAllTeams();
    const team = teams.find(t => t.id === teamId);

    if (!team) {
      console.error('Team not found');
      return false;
    }

    if (team.owner.id !== ownerId) {
      console.error('Only team owner can update member roles');
      return false;
    }

    const member = team.members.find(m => m.id === memberId);
    if (!member) {
      console.error('Member not found in team');
      return false;
    }

    member.role = newRole;
    member.permissions = newPermissions;

    this.saveTeams(teams);
    console.log(`👑 Updated member ${member.name} role to ${newRole} in team ${team.name}`);
    return true;
  }

  /**
   * Get team member details
   */
  getTeamMember(teamId: string, memberId: string): TeamMember | null {
    const teams = this.getAllTeams();
    const team = teams.find(t => t.id === teamId);

    if (!team) return null;

    if (team.owner.id === memberId) {
      return team.owner;
    }

    return team.members.find(m => m.id === memberId) || null;
  }

  /**
   * Check if user is team owner
   */
  isTeamOwner(teamId: string, userId: string): boolean {
    const teams = this.getAllTeams();
    const team = teams.find(t => t.id === teamId);
    return team ? team.owner.id === userId : false;
  }

  /**
   * Check if user is team member (including owner)
   */
  isTeamMember(teamId: string, userId: string): boolean {
    const teams = this.getAllTeams();
    const team = teams.find(t => t.id === teamId);
    
    if (!team) return false;

    return team.owner.id === userId || 
           team.members.some(m => m.id === userId);
  }

  /**
   * Get team statistics
   */
  getTeamStats(teamId: string): {
    totalMembers: number;
    activeMembers: number;
    totalAds: number;
    activeAds: number;
    totalVolume: string;
  } | null {
    const teams = this.getAllTeams();
    const team = teams.find(t => t.id === teamId);

    if (!team) return null;

    const activeMembers = team.members.filter(m => m.isActive).length + (team.owner.isActive ? 1 : 0);

    return {
      totalMembers: team.members.length + 1, // +1 for owner
      activeMembers,
      totalAds: team.totalAds,
      activeAds: team.activeAds,
      totalVolume: team.totalVolume,
    };
  }

  /**
   * Update team exchange connections
   */
  updateTeamExchanges(
    teamId: string,
    exchanges: {
      okx?: { connected: boolean; accountId?: string };
      binance?: { connected: boolean; accountId?: string };
      bybit?: { connected: boolean; accountId?: string };
    },
    ownerId: string
  ): boolean {
    const teams = this.getAllTeams();
    const team = teams.find(t => t.id === teamId);

    if (!team) {
      console.error('Team not found');
      return false;
    }

    if (team.owner.id !== ownerId) {
      console.error('Only team owner can update exchange connections');
      return false;
    }

    // Update exchange connections
    if (exchanges.okx) {
      team.exchanges.okx = { ...team.exchanges.okx, ...exchanges.okx };
    }
    if (exchanges.binance) {
      team.exchanges.binance = { ...team.exchanges.binance, ...exchanges.binance };
    }
    if (exchanges.bybit) {
      team.exchanges.bybit = { ...team.exchanges.bybit, ...exchanges.bybit };
    }

    this.saveTeams(teams);
    console.log(`🔗 Updated exchange connections for team ${team.name}`);
    return true;
  }

  /**
   * Deactivate/Activate team member
   */
  toggleMemberStatus(teamId: string, memberId: string, ownerId: string): boolean {
    const teams = this.getAllTeams();
    const team = teams.find(t => t.id === teamId);

    if (!team) {
      console.error('Team not found');
      return false;
    }

    if (team.owner.id !== ownerId) {
      console.error('Only team owner can toggle member status');
      return false;
    }

    const member = team.members.find(m => m.id === memberId);
    if (!member) {
      console.error('Member not found in team');
      return false;
    }

    member.isActive = !member.isActive;
    member.lastActive = new Date().toISOString();

    this.saveTeams(teams);
    console.log(`🔄 Toggled member ${member.name} status to ${member.isActive ? 'active' : 'inactive'}`);
    return true;
  }

  /**
   * Get teams where user has specific permissions
   */
  getTeamsByUserPermission(userId: string, permission: string): Team[] {
    const teams = this.getAllTeams();
    return teams.filter(team => {
      // Check if user is owner (owners have all permissions)
      if (team.owner.id === userId) {
        return true;
      }

      // Check if user is member with the permission
      const member = team.members.find(m => m.id === userId);
      return member && member.permissions.includes(permission);
    });
  }

  /**
   * Clear all teams (for testing purposes)
   */
  clearAllTeams(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
      console.log('🧹 Cleared all teams from localStorage');
    }
  }
}
