/**
 * P2P Merchant Team Roles and Permissions System
 * Defines roles and permissions for merchant teams in P2P trading operations
 */

export type UserType = 'merchant' | 'member';

export type TeamRole = 
  | 'owner'           // Merchant - Full control over team and operations
  | 'manager'         // Senior team member - Can manage operations and some team settings
  | 'trader'          // Active trading member - Can execute trades and manage orders
  | 'analyst'         // Data and strategy member - Can view analytics and create reports
  | 'viewer';         // Read-only access - Can view operations but not execute

export type Permission = 
  // Trading Operations
  | 'create_ads'          // Create new P2P ads
  | 'edit_ads'           // Modify existing ads
  | 'delete_ads'         // Remove ads
  | 'manage_orders'      // Accept, process, and manage orders
  | 'cancel_orders'      // Cancel orders
  
  // Financial Operations
  | 'view_financials'    // View financial data and balances
  | 'withdraw_funds'     // Process withdrawals
  | 'transfer_funds'     // Transfer funds between accounts
  
  // Team Management
  | 'invite_members'     // Invite new team members
  | 'remove_members'     // Remove team members
  | 'manage_roles'       // Change member roles and permissions
  | 'view_team'          // View team member list
  
  // Analytics and Reporting
  | 'view_analytics'     // View trading analytics
  | 'export_data'        // Export trading data
  | 'create_reports'     // Generate custom reports
  
  // System Settings
  | 'manage_settings'    // Change team settings
  | 'manage_api_keys'    // Manage exchange API keys
  | 'view_logs'          // View system and audit logs
  
  // Basic Access
  | 'read_access';       // Basic read access to the platform

export const ROLE_DEFINITIONS: Record<TeamRole, {
  label: string;
  description: string;
  permissions: Permission[];
  isOwnerOnly?: boolean;
}> = {
  owner: {
    label: 'Owner (Merchant)',
    description: 'Full control over all team operations, settings, and members',
    permissions: [
      'create_ads', 'edit_ads', 'delete_ads',
      'manage_orders', 'cancel_orders',
      'view_financials', 'withdraw_funds', 'transfer_funds',
      'invite_members', 'remove_members', 'manage_roles', 'view_team',
      'view_analytics', 'export_data', 'create_reports',
      'manage_settings', 'manage_api_keys', 'view_logs',
      'read_access'
    ],
    isOwnerOnly: true,
  },
  
  manager: {
    label: 'Operations Manager',
    description: 'Senior team member who can manage daily operations and basic team settings',
    permissions: [
      'create_ads', 'edit_ads', 'delete_ads',
      'manage_orders', 'cancel_orders',
      'view_financials', 'transfer_funds',
      'invite_members', 'view_team',
      'view_analytics', 'export_data', 'create_reports',
      'view_logs', 'read_access'
    ],
  },
  
  trader: {
    label: 'Active Trader',
    description: 'Can execute trades, manage orders, and handle customer interactions',
    permissions: [
      'create_ads', 'edit_ads',
      'manage_orders', 'cancel_orders',
      'view_financials',
      'view_team',
      'view_analytics', 'create_reports',
      'read_access'
    ],
  },
  
  analyst: {
    label: 'Data Analyst',
    description: 'Focuses on analytics, reporting, and strategy development',
    permissions: [
      'view_financials',
      'view_team',
      'view_analytics', 'export_data', 'create_reports',
      'view_logs', 'read_access'
    ],
  },
  
  viewer: {
    label: 'Viewer',
    description: 'Read-only access to monitor operations and view reports',
    permissions: [
      'view_team',
      'view_analytics',
      'read_access'
    ],
  },
};

export const USER_TYPE_DEFINITIONS: Record<UserType, {
  label: string;
  description: string;
  defaultRole: TeamRole;
  canCreateTeams: boolean;
}> = {
  merchant: {
    label: 'P2P Merchant',
    description: 'Main P2P trader who creates and manages teams across multiple exchanges',
    defaultRole: 'owner',
    canCreateTeams: true,
  },
  
  member: {
    label: 'Team Member',
    description: 'User who joins merchant teams with specific roles and permissions',
    defaultRole: 'trader',
    canCreateTeams: false,
  },
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(role: TeamRole, permission: Permission): boolean {
  return ROLE_DEFINITIONS[role]?.permissions.includes(permission) || false;
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: TeamRole): Permission[] {
  return ROLE_DEFINITIONS[role]?.permissions || [];
}

/**
 * Check if a role can be assigned by another role
 */
export function canAssignRole(assignerRole: TeamRole, targetRole: TeamRole): boolean {
  // Only owners can assign owner role
  if (targetRole === 'owner') {
    return assignerRole === 'owner';
  }
  
  // Owners and managers can assign non-owner roles
  return assignerRole === 'owner' || assignerRole === 'manager';
}

/**
 * Get available roles that a user can assign
 */
export function getAssignableRoles(assignerRole: TeamRole): TeamRole[] {
  if (assignerRole === 'owner') {
    return ['manager', 'trader', 'analyst', 'viewer'];
  }
  
  if (assignerRole === 'manager') {
    return ['trader', 'analyst', 'viewer'];
  }
  
  return [];
}

/**
 * Validate if a user type can have a specific role
 */
export function isValidUserTypeRole(userType: UserType, role: TeamRole): boolean {
  if (userType === 'merchant') {
    return role === 'owner';
  }
  
  if (userType === 'member') {
    return role !== 'owner';
  }
  
  return false;
}
