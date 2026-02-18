export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  provider?: string;
  provider_id?: string;
  email_verified: boolean;
  user_type: 'merchant' | 'member';
  created_at: string;
  updated_at: string;
}

export interface ExchangeCredentials {
  id: string;
  exchange: 'okx' | 'binance' | 'bybit';
  api_key: string;
  api_secret: string;
  passphrase?: string;
  testnet: boolean;
  is_active: boolean;
}

export interface UserProfile {
  id: string;
  user_id: string;
  exchange_provider?: string;
  exchange_user_id?: string;
  trading_volume: number;
  completed_trades: number;
  success_rate: number;
  average_rating: number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
}

export type AuthSessionUser = {
  id: string;
  email?: string;
};

export interface AuthServiceInterface {
  getCurrentUser(): Promise<AuthSessionUser | null>;
  signOut(): Promise<void>;
}

export interface UserServiceInterface {
  // Authentication
  getCurrentUser(): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  
  // Profile management
  updateUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile | null>;
  getUserProfile(userId: string): Promise<UserProfile | null>;
  
  // Exchange credentials
  getExchangeCredentials(userId: string): Promise<ExchangeCredentials[]>;
  saveExchangeCredentials(userId: string, credentials: Omit<ExchangeCredentials, 'id'>): Promise<ExchangeCredentials>;
  updateExchangeCredentials(credentialsId: string, credentials: Partial<ExchangeCredentials>): Promise<ExchangeCredentials | null>;
  deleteExchangeCredentials(credentialsId: string): Promise<boolean>;
  testExchangeConnection(credentialsId: string): Promise<{
    success: boolean;
    balance?: string;
    permissions?: string[];
    error?: string;
  }>;
  
  // User statistics
  getUserStats(userId: string): Promise<{
    totalTrades: number;
    totalVolume: number;
    successRate: number;
    averageRating: number;
    totalReviews: number;
    teamMemberships: number;
    activeAds: number;
  }>;
  
  // Search and discovery
  searchUsers(query: string, limit?: number): Promise<User[]>;
  getUsersByIds(userIds: string[]): Promise<User[]>;
  
  // Settings and preferences
  getUserSettings(userId: string): Promise<Record<string, any>>;
  updateUserSettings(userId: string, settings: Record<string, any>): Promise<boolean>;
  
  // Real-time subscriptions (for Supabase)
  subscribeToUserChanges?(userId: string, callback: (user: User) => void): () => void;
}
