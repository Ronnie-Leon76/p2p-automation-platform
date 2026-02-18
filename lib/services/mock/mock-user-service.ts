import type { ExchangeCredentials, User, UserProfile, UserServiceInterface } from '../interfaces/user-service';

export class MockUserService implements UserServiceInterface {
  async getCurrentUser(): Promise<User | null> {
    // In a hook-based component, we'd get this from context
    // For service layer, we'll simulate with localStorage
    if (typeof window === 'undefined') return null;
    
    const session = localStorage.getItem('mock_auth_session');
    if (!session) return null;
    
    const parsedSession = JSON.parse(session);
    const mockUser = parsedSession.user;
    
    if (!mockUser) return null;
    
    return {
      id: mockUser.id,
      email: mockUser.email,
      full_name: mockUser.full_name,
      avatar_url: mockUser.avatar_url,
      provider: mockUser.provider || 'email',
      provider_id: mockUser.provider_id,
      email_verified: mockUser.email_verified || false,
      user_type: mockUser.user_type || 'merchant',
      created_at: mockUser.created_at || new Date().toISOString(),
      updated_at: mockUser.updated_at || new Date().toISOString(),
    };
  }

  async getUserById(id: string): Promise<User | null> {
    // Mock implementation - in real app would query database
    const currentUser = await this.getCurrentUser();
    if (currentUser?.id === id) return currentUser;
    
    // Return mock user for other IDs
    return {
      id,
      email: `user-${id}@example.com`,
      full_name: `Mock User ${id}`,
      avatar_url: 'https://res.cloudinary.com/daqr2zwhj/image/upload/v1749292046/placeholder-user.jpg',
      provider: 'email',
      email_verified: true,
      user_type: 'merchant',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const currentUser = await this.getCurrentUser();
    if (currentUser?.email === email) return currentUser;
    
    // Mock implementation
    return null;
  }

  async updateUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile | null> {
    // Mock implementation - would update database
    const profile = await this.getUserProfile(userId);
    if (!profile) return null;
    
    const updatedProfile = { ...profile, ...profileData, updated_at: new Date().toISOString() };
    
    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem(`mock_user_profile_${userId}`, JSON.stringify(updatedProfile));
    }
    
    return updatedProfile;
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (typeof window === 'undefined') return null;
    
    const stored = localStorage.getItem(`mock_user_profile_${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Return default profile
    return {
      id: `profile-${userId}`,
      user_id: userId,
      exchange_provider: undefined,
      exchange_user_id: undefined,
      trading_volume: 0,
      completed_trades: 0,
      success_rate: 0,
      average_rating: 0,
      total_reviews: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  async getExchangeCredentials(userId: string): Promise<ExchangeCredentials[]> {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(`mock_exchange_credentials_${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }
    
    return [];
  }

  async saveExchangeCredentials(userId: string, credentials: Omit<ExchangeCredentials, 'id'>): Promise<ExchangeCredentials> {
    const newCredentials: ExchangeCredentials = {
      id: `cred-${Date.now()}`,
      ...credentials,
    };
    
    const existing = await this.getExchangeCredentials(userId);
    const updated = [...existing.filter(c => c.exchange !== credentials.exchange), newCredentials];
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(`mock_exchange_credentials_${userId}`, JSON.stringify(updated));
    }
    
    return newCredentials;
  }

  async updateExchangeCredentials(credentialsId: string, credentials: Partial<ExchangeCredentials>): Promise<ExchangeCredentials | null> {
    // Mock implementation - would need to know which user these belong to
    // For now, we'll check current user
    const currentUser = await this.getCurrentUser();
    if (!currentUser) return null;
    
    const existing = await this.getExchangeCredentials(currentUser.id);
    const credIndex = existing.findIndex(c => c.id === credentialsId);
    
    if (credIndex === -1) return null;
    
    const updated = { ...existing[credIndex], ...credentials };
    existing[credIndex] = updated;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(`mock_exchange_credentials_${currentUser.id}`, JSON.stringify(existing));
    }
    
    return updated;
  }

  async deleteExchangeCredentials(credentialsId: string): Promise<boolean> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) return false;
    
    const existing = await this.getExchangeCredentials(currentUser.id);
    const filtered = existing.filter(c => c.id !== credentialsId);
    
    if (filtered.length === existing.length) return false;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(`mock_exchange_credentials_${currentUser.id}`, JSON.stringify(filtered));
    }
    
    return true;
  }

  async testExchangeConnection(credentialsId: string): Promise<{
    success: boolean;
    balance?: string;
    permissions?: string[];
    error?: string;
  }> {
    // Mock implementation - simulate API test
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
    
    // Mock success for valid looking credentials
    return {
      success: true,
      balance: '1,234.56 USDT',
      permissions: ['read', 'trade'],
    };
  }

  async getUserStats(userId: string): Promise<{
    totalTrades: number;
    totalVolume: number;
    successRate: number;
    averageRating: number;
    totalReviews: number;
    teamMemberships: number;
    activeAds: number;
  }> {
    const profile = await this.getUserProfile(userId);
    
    return {
      totalTrades: profile?.completed_trades || 0,
      totalVolume: profile?.trading_volume || 0,
      successRate: profile?.success_rate || 0,
      averageRating: profile?.average_rating || 0,
      totalReviews: profile?.total_reviews || 0,
      teamMemberships: 0, // Would be calculated from team service
      activeAds: 0, // Would be calculated from ad service
    };
  }

  async searchUsers(query: string, limit: number = 10): Promise<User[]> {
    // Mock implementation - return empty for now
    return [];
  }

  async getUsersByIds(userIds: string[]): Promise<User[]> {
    const users: User[] = [];
    
    for (const id of userIds) {
      const user = await this.getUserById(id);
      if (user) users.push(user);
    }
    
    return users;
  }

  async getUserSettings(userId: string): Promise<Record<string, any>> {
    if (typeof window === 'undefined') return {};
    
    const stored = localStorage.getItem(`mock_user_settings_${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }
    
    return {
      notifications: true,
      theme: 'light',
      language: 'en',
      autoReply: false,
    };
  }

  async updateUserSettings(userId: string, settings: Record<string, any>): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    
    const existing = await this.getUserSettings(userId);
    const updated = { ...existing, ...settings };
    
    localStorage.setItem(`mock_user_settings_${userId}`, JSON.stringify(updated));
    return true;
  }
}
