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

// Environment management
import { environmentManager, getEnvironmentMode, isMockMode } from "../config/environment";

/**
 * Service Factory with Environment-Aware Configuration
 * Automatically selects the correct service implementation based on environment
 */
export class ServiceFactory {
  private static instance: ServiceFactory;

  private constructor() {
    // Log environment detection on startup
    if (typeof window !== 'undefined' && environmentManager.getConfig().ui.showDebugInfo) {
      console.log('🏭 ServiceFactory initialized with environment:', environmentManager.getDebugInfo());
    }
  }

  public static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }

  /**
   * Get current environment mode
   */
  public getEnvironmentMode() {
    return getEnvironmentMode();
  }

  /**
   * Check if using mock data (legacy method for backward compatibility)
   */
  public isUsingMockData(): boolean {
    return isMockMode();
  }

  /**
   * Legacy setter for backward compatibility
   */
  public setUseMockData(useMockData: boolean): void {
    if (process.env.NODE_ENV === 'production') {
      console.warn('Cannot manually set mock data in production');
      return;
    }
    
    environmentManager.switchMode(useMockData ? 'mock' : 'local');
  }

  /**
   * Get Ad Service based on environment
   */
  public getAdService(): AdServiceInterface {
    if (isMockMode()) {
      return new MockAdService();
    }
    return new SupabaseAdService();
  }

  /**
   * Get Team Service based on environment
   */
  public getTeamService(): TeamServiceInterface {
    if (isMockMode()) {
      return new MockTeamService();
    }
    return new SupabaseTeamService();
  }

  /**
   * Get User Service based on environment
   */
  public getUserService(): UserServiceInterface {
    if (isMockMode()) {
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

  /**
   * Development helper to switch between environments
   */
  public async switchToMockData(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot switch to mock mode in production');
    }
    
    environmentManager.switchMode('mock');
    console.log('🎭 Switched to mock data services');
  }

  public async switchToLiveData(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot switch to live mode in production');
    }
    
    environmentManager.switchMode('local');
    console.log('🏠 Switched to local Supabase services');
  }

  public async switchToLocalMode(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot switch to local mode in production');
    }
    
    environmentManager.switchMode('local');
    console.log('🏠 Switched to local Supabase services');
  }

  public async switchToProductionMode(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot switch to production mode in production');
    }
    
    environmentManager.switchMode('production');
    console.log('🚀 Switched to production services');
  }

  /**
   * Health check for all services
   */
  public async healthCheck(): Promise<{
    mode: string;
    services: {
      ad: boolean;
      team: boolean;
      user: boolean;
    };
    timestamp: string;
  }> {
    const mode = getEnvironmentMode();
    
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

