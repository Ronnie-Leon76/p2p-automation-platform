export interface TeamCredentials {
  id: string;
  team_id: string;
  exchange_provider: string;
  owner_user_id: string;
  encrypted_access_token: string;
  encrypted_refresh_token?: string;
  token_expires_at?: string;
  api_permissions: string[];
  is_active: boolean;
}

export interface TeamMemberPermission {
  permission_type: string;
  permission_scope: string;
  is_active: boolean;
}

export class TeamDelegationService {
  private warn(method: string): void {
    console.warn(`[TeamDelegationService] ${method} is not implemented in Prisma yet.`);
  }

  async setupTeamCredentials(
    _teamId: string,
    _ownerUserId: string,
    _exchangeProvider: string,
    _accessToken: string,
    _refreshToken?: string,
    _expiresAt?: Date,
  ): Promise<boolean> {
    this.warn("setupTeamCredentials");
    return false;
  }

  async getTeamCredentials(_teamId: string, _exchangeProvider: string): Promise<TeamCredentials | null> {
    this.warn("getTeamCredentials");
    return null;
  }

  async revokeTeamCredentials(_teamId: string, _exchangeProvider: string): Promise<boolean> {
    this.warn("revokeTeamCredentials");
    return false;
  }

  async setMemberPermissions(
    _teamMemberId: string,
    _permissions: Array<{ type: string; scope: string }>,
    _grantedBy?: string,
  ): Promise<boolean> {
    this.warn("setMemberPermissions");
    return false;
  }

  async grantMemberPermissions(
    _teamMemberId: string,
    _permissions: Array<{ type: string; scope: string }>,
    _grantedBy: string,
  ): Promise<boolean> {
    this.warn("grantMemberPermissions");
    return false;
  }

  async getMemberPermissions(_teamMemberId: string): Promise<TeamMemberPermission[]> {
    this.warn("getMemberPermissions");
    return [];
  }

  async canMemberTrade(_userId: string, _teamId: string): Promise<boolean> {
    this.warn("canMemberTrade");
    return false;
  }

  async getDecryptedAccessToken(_teamId: string, _exchangeProvider: string): Promise<string | null> {
    this.warn("getDecryptedAccessToken");
    return null;
  }

  async canPerformOperation(
    _userId: string,
    _teamId: string,
    _operationType: string,
    _scope = "all",
  ): Promise<boolean> {
    this.warn("canPerformOperation");
    return false;
  }

  async logTeamOperation(
    _teamId: string,
    _performedBy: string,
    _operationType: string,
    _exchangeProvider: string,
    _externalOperationId?: string,
    _operationData?: unknown,
    _success = true,
    _errorMessage?: string,
  ): Promise<void> {
    this.warn("logTeamOperation");
  }
}
