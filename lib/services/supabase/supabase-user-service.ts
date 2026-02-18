import type { ExchangeCredentials, User, UserProfile, UserServiceInterface } from '../interfaces/user-service';
import { supabase } from './supabase-client';

export class SupabaseUserService implements UserServiceInterface {

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authData.user) {
        return null;
      }

      return {
        id: authData.user.id,
        email: authData.user.email || '',
        full_name: authData.user.user_metadata?.full_name || authData.user.email || '',
        avatar_url: authData.user.user_metadata?.avatar_url,
        provider: 'email',
        email_verified: authData.user.email_confirmed_at != null,
        user_type: (authData.user.user_metadata?.user_type as 'merchant' | 'member') || 'merchant',
        created_at: authData.user.created_at,
        updated_at: authData.user.updated_at || authData.user.created_at,
      };
    } catch (error) {
      console.error('Unexpected error in getCurrentUser:', error);
      return null;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) return null;
      return data;
    } catch (error) {
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) return null;
      return data;
    } catch (error) {
      return null;
    }
  }

  async updateUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile | null> {
    return await this.getUserProfile(userId);
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const user = await this.getUserById(userId);
    if (!user) return null;

    return {
      id: `profile_${userId}`,
      user_id: userId,
      trading_volume: 0,
      completed_trades: 0,
      success_rate: 100,
      average_rating: 5.0,
      total_reviews: 0,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  async getExchangeCredentials(userId: string): Promise<ExchangeCredentials[]> {
    return [];
  }

  async saveExchangeCredentials(userId: string, credentials: Omit<ExchangeCredentials, 'id'>): Promise<ExchangeCredentials> {
    throw new Error('Not implemented');
  }

  async updateExchangeCredentials(credentialsId: string, credentials: Partial<ExchangeCredentials>): Promise<ExchangeCredentials | null> {
    return null;
  }

  async deleteExchangeCredentials(credentialsId: string): Promise<boolean> {
    return false;
  }

  async testExchangeConnection(credentialsId: string): Promise<{
    success: boolean;
    balance?: string;
    permissions?: string[];
    error?: string;
  }> {
    return { success: true, balance: '1000.00 USDT', permissions: ['trade', 'read'] };
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
    return {
      totalTrades: 0,
      totalVolume: 0,
      successRate: 100,
      averageRating: 5.0,
      totalReviews: 0,
      teamMemberships: 0,
      activeAds: 0,
    };
  }

  async searchUsers(query: string, limit: number = 10): Promise<User[]> {
    return [];
  }

  async getUsersByIds(userIds: string[]): Promise<User[]> {
    return [];
  }

  async getUserSettings(userId: string): Promise<Record<string, any>> {
    return {};
  }

  async updateUserSettings(userId: string, settings: Record<string, any>): Promise<boolean> {
    return true;
  }
}
