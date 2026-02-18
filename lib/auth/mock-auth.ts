/**
 * Mock Authentication Service for Development
 * Provides fake login/signup functionality to test authenticated features
 */

import { getBrowserDbClient } from "@/lib/composition/browser-db-composer";

export interface MockUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  provider: string;
  created_at: string;
  exchange_credentials?: {
    exchange: string;
    api_key: string;
    api_secret: string;
    passphrase?: string;
  };
}

export class MockAuthService {
  private static instance: MockAuthService;
  private supabase = getBrowserDbClient();

  static getInstance(): MockAuthService {
    if (!MockAuthService.instance) {
      MockAuthService.instance = new MockAuthService();
    }
    return MockAuthService.instance;
  }

  /**
   * Mock user profiles for development
   */
  private mockUsers: MockUser[] = [
    {
      id: "mock-user-1",
      email: "trader1@example.com",
      full_name: "John Trader",
      avatar_url: "https://res.cloudinary.com/daqr2zwhj/image/upload/v1749292046/placeholder-user.jpg",
      provider: "okx",
      created_at: new Date().toISOString(),
      exchange_credentials: {
        exchange: "okx",
        api_key: process.env.OKX_API_KEY || "mock-api-key",
        api_secret: process.env.OKX_API_SECRET || "mock-api-secret",
        passphrase: process.env.OKX_API_PASSPHRASE || "mock-passphrase"
      }
    },
    {
      id: "mock-user-2", 
      email: "trader2@example.com",
      full_name: "Jane Smith",
      avatar_url: "https://res.cloudinary.com/daqr2zwhj/image/upload/v1749292046/placeholder-user.jpg",
      provider: "binance",
      created_at: new Date().toISOString(),
      exchange_credentials: {
        exchange: "binance",
        api_key: "mock-binance-key",
        api_secret: "mock-binance-secret"
      }
    },
    {
      id: "mock-user-3",
      email: "trader3@example.com", 
      full_name: "Mike Johnson",
      avatar_url: "https://res.cloudinary.com/daqr2zwhj/image/upload/v1749292046/placeholder-user.jpg",
      provider: "bybit",
      created_at: new Date().toISOString(),
      exchange_credentials: {
        exchange: "bybit",
        api_key: "mock-bybit-key",
        api_secret: "mock-bybit-secret"
      }
    }
  ];

  /**
   * Mock login with exchange selection
   */
  async mockLogin(exchange: 'okx' | 'binance' | 'bybit', userIndex: number = 0): Promise<MockUser> {
    const user = this.mockUsers.find(u => u.provider === exchange) || this.mockUsers[userIndex];
    
    // Store mock session in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('mock_auth_session', JSON.stringify({
        user,
        expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        access_token: `mock_token_${user.id}`,
        refresh_token: `mock_refresh_${user.id}`
      }));
      
      // Also store exchange credentials separately
      localStorage.setItem('mock_exchange_credentials', JSON.stringify(user.exchange_credentials));
    }

    console.log(`🎭 Mock login successful for ${user.full_name} (${user.provider.toUpperCase()})`);
    return user;
  }

  /**
   * Mock signup with exchange
   */
  async mockSignup(email: string, fullName: string, exchange: 'okx' | 'binance' | 'bybit'): Promise<MockUser> {
    const newUser: MockUser = {
      id: `mock-user-${Date.now()}`,
      email,
      full_name: fullName,
      avatar_url: "https://res.cloudinary.com/daqr2zwhj/image/upload/v1749292046/placeholder-user.jpg",
      provider: exchange,
      created_at: new Date().toISOString(),
      exchange_credentials: {
        exchange,
        api_key: exchange === 'okx' ? (process.env.OKX_API_KEY || `mock-${exchange}-key`) : `mock-${exchange}-key`,
        api_secret: exchange === 'okx' ? (process.env.OKX_API_SECRET || `mock-${exchange}-secret`) : `mock-${exchange}-secret`,
        passphrase: exchange === 'okx' ? (process.env.OKX_API_PASSPHRASE || `mock-${exchange}-passphrase`) : undefined
      }
    };

    // Store in mock users list
    this.mockUsers.push(newUser);

    // Create session
    if (typeof window !== 'undefined') {
      localStorage.setItem('mock_auth_session', JSON.stringify({
        user: newUser,
        expires_at: Date.now() + (24 * 60 * 60 * 1000),
        access_token: `mock_token_${newUser.id}`,
        refresh_token: `mock_refresh_${newUser.id}`
      }));

      localStorage.setItem('mock_exchange_credentials', JSON.stringify(newUser.exchange_credentials));
    }

    console.log(`🎭 Mock signup successful for ${newUser.full_name} (${newUser.provider.toUpperCase()})`);
    return newUser;
  }

  /**
   * Get current mock session
   */
  getCurrentMockSession(): { user: MockUser; expires_at: number; access_token: string } | null {
    if (typeof window === 'undefined') return null;

    const sessionStr = localStorage.getItem('mock_auth_session');
    if (!sessionStr) return null;

    try {
      const session = JSON.parse(sessionStr);
      if (session.expires_at < Date.now()) {
        this.mockLogout();
        return null;
      }
      return session;
    } catch (error) {
      console.error('Failed to parse mock session:', error);
      return null;
    }
  }

  /**
   * Get current mock user
   */
  getCurrentMockUser(): MockUser | null {
    const session = this.getCurrentMockSession();
    return session?.user || null;
  }

  /**
   * Check if user is mock authenticated
   */
  isMockAuthenticated(): boolean {
    return this.getCurrentMockSession() !== null;
  }

  /**
   * Mock logout
   */
  mockLogout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mock_auth_session');
      localStorage.removeItem('mock_exchange_credentials');
    }
    console.log('🎭 Mock logout successful');
  }

  /**
   * Get mock exchange credentials
   */
  getMockExchangeCredentials(): any {
    if (typeof window === 'undefined') return null;
    
    const credsStr = localStorage.getItem('mock_exchange_credentials');
    if (!credsStr) return null;

    try {
      return JSON.parse(credsStr);
    } catch (error) {
      console.error('Failed to parse mock exchange credentials:', error);
      return null;
    }
  }

  /**
   * Check if we're in development mode
   */
  static isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }
}

