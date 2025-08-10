import type { AdServiceInterface } from './interfaces/ad-service';
import type { TeamServiceInterface } from './interfaces/team-service';
import type { UserServiceInterface } from './interfaces/user-service';

// Mock service imports
import { MockAdService } from './mock/mock-ad-service';
import { MockTeamService } from './mock/mock-team-service';
import { MockUserService } from './mock/mock-user-service';

// Supabase service imports
import { SupabaseAdService } from './supabase/supabase-ad-service';
import { SupabaseTeamService } from './supabase/supabase-team-service';
import { SupabaseUserService } from './supabase/supabase-user-service';

export class ServiceFactory {
  private static instance: ServiceFactory;
  private useMockData: boolean;

  private constructor() {
    this.useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' || 
                      process.env.NODE_ENV === 'development';
  }

  public static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }

  public setUseMockData(useMockData: boolean): void {
    this.useMockData = useMockData;
  }

  public isUsingMockData(): boolean {
    return this.useMockData;
  }

  public getAdService(): AdServiceInterface {
    if (this.useMockData) {
      return new MockAdService();
    }
    return new SupabaseAdService();
  }

  public getTeamService(): TeamServiceInterface {
    if (this.useMockData) {
      return new MockTeamService();
    }
    return new SupabaseTeamService();
  }

  public getUserService(): UserServiceInterface {
    if (this.useMockData) {
      return new MockUserService();
    }
    return new SupabaseUserService();
  }

  // Utility method to get all services at once
  public getServices() {
    return {
      adService: this.getAdService(),
      teamService: this.getTeamService(),
      userService: this.getUserService(),
    };
  }

  // Development helper to switch between mock and live data
  public async switchToMockData(): Promise<void> {
    this.setUseMockData(true);
    console.log('🔄 Switched to mock data services');
  }

  public async switchToLiveData(): Promise<void> {
    this.setUseMockData(false);
    console.log('🔄 Switched to live Supabase services');
  }

  // Health check for services
  public async healthCheck(): Promise<{
    mode: 'mock' | 'live';
    services: {
      ad: boolean;
      team: boolean;
      user: boolean;
    };
    timestamp: string;
  }> {
    const mode = this.useMockData ? 'mock' : 'live';
    
    try {
      const adService = this.getAdService();
      const teamService = this.getTeamService();
      const userService = this.getUserService();

      // Test basic operations
      const [ads, teams, user] = await Promise.all([
        adService.getAllAds().catch(() => null),
        teamService.getAllTeams().catch(() => null),
        userService.getCurrentUser().catch(() => null),
      ]);

      return {
        mode,
        services: {
          ad: ads !== null,
          team: teams !== null,
          user: user !== null,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        mode,
        services: {
          ad: false,
          team: false,
          user: false,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Export singleton instance
export const serviceFactory = ServiceFactory.getInstance();

// Export types for convenience
export type { AdServiceInterface, TeamServiceInterface, UserServiceInterface };

