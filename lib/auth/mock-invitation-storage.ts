/**
 * Team Invitation System for P2P Trading Platform
 * Handles invitations for users with and without exchange accounts
 */

export interface TeamInvitation {
  id: string;
  teamId: string;
  teamName: string;
  inviterUserId: string;
  inviterName: string;
  inviteeEmail: string;
  inviteeName?: string; // Optional if user doesn't exist
  status: "pending" | "accepted" | "declined" | "expired";
  role: "admin" | "manager" | "operator";
  permissions: string[];
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  declinedAt?: string;
  inviteCode: string; // Unique code for invitation link
  requiresExchangeAccount: boolean;
  suggestedExchange?: "okx" | "binance" | "bybit";
  onboardingSteps: {
    profileCreated: boolean;
    exchangeConnected: boolean;
    trainingCompleted: boolean;
  };
}

export interface PendingUser {
  id: string;
  email: string;
  name?: string;
  invitationId: string;
  tempPassword?: string;
  hasExchangeAccount: boolean;
  suggestedExchange?: "okx" | "binance" | "bybit";
  createdAt: string;
  status: "pending_verification" | "pending_exchange" | "ready_to_join";
}

export class MockInvitationStorage {
  private static instance: MockInvitationStorage;
  private invitationsKey = 'mock_team_invitations';
  private pendingUsersKey = 'mock_pending_users';

  static getInstance(): MockInvitationStorage {
    if (!MockInvitationStorage.instance) {
      MockInvitationStorage.instance = new MockInvitationStorage();
    }
    return MockInvitationStorage.instance;
  }

  /**
   * Generate unique invitation code
   */
  private generateInviteCode(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Create a team invitation
   */
  createInvitation(
    teamId: string,
    teamName: string,
    inviterUserId: string,
    inviterName: string,
    inviteeEmail: string,
    role: "admin" | "manager" | "operator",
    permissions: string[],
    requiresExchangeAccount: boolean = true,
    suggestedExchange?: "okx" | "binance" | "bybit"
  ): TeamInvitation {
    const invitations = this.getAllInvitations();
    
    // Check if invitation already exists for this email and team
    const existingInvitation = invitations.find(
      inv => inv.inviteeEmail === inviteeEmail && 
             inv.teamId === teamId && 
             inv.status === "pending"
    );

    if (existingInvitation) {
      throw new Error("Invitation already exists for this email");
    }

    const invitation: TeamInvitation = {
      id: `inv-${Date.now()}`,
      teamId,
      teamName,
      inviterUserId,
      inviterName,
      inviteeEmail,
      status: "pending",
      role,
      permissions,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      inviteCode: this.generateInviteCode(),
      requiresExchangeAccount,
      suggestedExchange,
      onboardingSteps: {
        profileCreated: false,
        exchangeConnected: false,
        trainingCompleted: false,
      },
    };

    const updatedInvitations = [...invitations, invitation];
    this.saveInvitations(updatedInvitations);

    console.log(`📧 Created invitation for ${inviteeEmail} to join ${teamName}`);
    return invitation;
  }

  /**
   * Get all invitations
   */
  getAllInvitations(): TeamInvitation[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(this.invitationsKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load invitations:', error);
      return [];
    }
  }

  /**
   * Save invitations to localStorage
   */
  private saveInvitations(invitations: TeamInvitation[]): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.invitationsKey, JSON.stringify(invitations));
    } catch (error) {
      console.error('Failed to save invitations:', error);
    }
  }

  /**
   * Get invitations by team ID
   */
  getInvitationsByTeam(teamId: string): TeamInvitation[] {
    return this.getAllInvitations().filter(inv => inv.teamId === teamId);
  }

  /**
   * Get invitations by email
   */
  getInvitationsByEmail(email: string): TeamInvitation[] {
    return this.getAllInvitations().filter(inv => inv.inviteeEmail === email);
  }

  /**
   * Get invitation by invite code
   */
  getInvitationByCode(inviteCode: string): TeamInvitation | null {
    return this.getAllInvitations().find(inv => inv.inviteCode === inviteCode) || null;
  }

  /**
   * Accept an invitation
   */
  acceptInvitation(invitationId: string): TeamInvitation | null {
    const invitations = this.getAllInvitations();
    const invitation = invitations.find(inv => inv.id === invitationId);

    if (!invitation) {
      console.error('Invitation not found');
      return null;
    }

    if (invitation.status !== "pending") {
      console.error('Invitation is not pending');
      return null;
    }

    if (new Date() > new Date(invitation.expiresAt)) {
      console.error('Invitation has expired');
      return null;
    }

    invitation.status = "accepted";
    invitation.acceptedAt = new Date().toISOString();

    this.saveInvitations(invitations);
    console.log(`✅ Invitation accepted: ${invitation.inviteeEmail}`);
    return invitation;
  }

  /**
   * Decline an invitation
   */
  declineInvitation(invitationId: string): boolean {
    const invitations = this.getAllInvitations();
    const invitation = invitations.find(inv => inv.id === invitationId);

    if (!invitation) {
      console.error('Invitation not found');
      return false;
    }

    invitation.status = "declined";
    invitation.declinedAt = new Date().toISOString();

    this.saveInvitations(invitations);
    console.log(`❌ Invitation declined: ${invitation.inviteeEmail}`);
    return true;
  }

  /**
   * Create pending user for invitation without exchange account
   */
  createPendingUser(
    email: string,
    invitationId: string,
    name?: string,
    suggestedExchange?: "okx" | "binance" | "bybit"
  ): PendingUser {
    const pendingUsers = this.getAllPendingUsers();
    
    const pendingUser: PendingUser = {
      id: `pending-${Date.now()}`,
      email,
      name,
      invitationId,
      hasExchangeAccount: false,
      suggestedExchange,
      createdAt: new Date().toISOString(),
      status: "pending_verification",
    };

    const updatedUsers = [...pendingUsers, pendingUser];
    this.savePendingUsers(updatedUsers);

    console.log(`👤 Created pending user: ${email}`);
    return pendingUser;
  }

  /**
   * Get all pending users
   */
  getAllPendingUsers(): PendingUser[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(this.pendingUsersKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load pending users:', error);
      return [];
    }
  }

  /**
   * Save pending users to localStorage
   */
  private savePendingUsers(users: PendingUser[]): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.pendingUsersKey, JSON.stringify(users));
    } catch (error) {
      console.error('Failed to save pending users:', error);
    }
  }

  /**
   * Update pending user status
   */
  updatePendingUser(userId: string, updates: Partial<PendingUser>): PendingUser | null {
    const users = this.getAllPendingUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      console.error('Pending user not found');
      return null;
    }

    users[userIndex] = { ...users[userIndex], ...updates };
    this.savePendingUsers(users);

    console.log(`📝 Updated pending user: ${users[userIndex].email}`);
    return users[userIndex];
  }

  /**
   * Generate invitation link
   */
  generateInvitationLink(inviteCode: string): string {
    // In production, this would be your actual domain
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    return `${baseUrl}/invite/${inviteCode}`;
  }

  /**
   * Clean up expired invitations
   */
  cleanupExpiredInvitations(): number {
    const invitations = this.getAllInvitations();
    const now = new Date();
    
    const activeInvitations = invitations.filter(inv => {
      if (inv.status === "pending" && new Date(inv.expiresAt) < now) {
        inv.status = "expired";
        return true;
      }
      return true;
    });

    const expiredCount = invitations.filter(inv => inv.status === "expired").length;
    this.saveInvitations(activeInvitations);

    if (expiredCount > 0) {
      console.log(`🧹 Cleaned up ${expiredCount} expired invitations`);
    }

    return expiredCount;
  }

  /**
   * Get invitation statistics for a team
   */
  getTeamInvitationStats(teamId: string): {
    pending: number;
    accepted: number;
    declined: number;
    expired: number;
  } {
    const invitations = this.getInvitationsByTeam(teamId);
    
    return {
      pending: invitations.filter(inv => inv.status === "pending").length,
      accepted: invitations.filter(inv => inv.status === "accepted").length,
      declined: invitations.filter(inv => inv.status === "declined").length,
      expired: invitations.filter(inv => inv.status === "expired").length,
    };
  }
}
