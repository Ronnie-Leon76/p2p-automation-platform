import type { AdServiceInterface } from './interfaces/ad-service';
import type { TeamServiceInterface } from './interfaces/team-service';
import type { AuthServiceInterface, UserServiceInterface } from './interfaces/user-service';

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

export type BackendAdapter = "mock" | "supabase" | "postgres";

type ServiceBundle = {
  adService: AdServiceInterface;
  teamService: TeamServiceInterface;
  userService: UserServiceInterface;
  authService?: AuthServiceInterface;
};

/**
 * Service Factory with Environment-Aware Configuration
 * Automatically selects the correct service implementation based on environment
 */
export class ServiceFactory {
  private static instance: ServiceFactory;
  private cachedServices: Partial<Record<BackendAdapter, ServiceBundle>> = {};

  private constructor() {
    // Log environment detection on startup
    if (typeof window !== 'undefined' && environmentManager.getConfig().ui.showDebugInfo) {
      console.log('🏭 ServiceFactory initialized with environment:', environmentManager.getDebugInfo());
    }
  }

  private getConfiguredBackendAdapter(): BackendAdapter {
    const configured = process.env.NEXT_PUBLIC_BACKEND_ADAPTER?.toLowerCase();
    if (configured === "mock" || configured === "supabase" || configured === "postgres") {
      return configured;
    }

    if (isMockMode()) {
      return "mock";
    }

    return "supabase";
  }

  private createServicesForAdapter(adapter: BackendAdapter): ServiceBundle {
    switch (adapter) {
      case "mock":
        return {
          adService: new MockAdService(),
          teamService: new MockTeamService(),
          userService: new MockUserService(),
        };
      case "supabase":
        return {
          adService: new SupabaseAdService(),
          teamService: new SupabaseTeamService(),
          userService: new SupabaseUserService(),
        };
      case "postgres":
        throw new Error("Postgres adapter is not implemented yet. Set NEXT_PUBLIC_BACKEND_ADAPTER to 'supabase' or 'mock'.");
      default:
        throw new Error(`Unknown backend adapter: ${adapter}`);
    }
  }

  private getServicesForCurrentAdapter(): ServiceBundle {
    const adapter = this.getConfiguredBackendAdapter();
    if (!this.cachedServices[adapter]) {
      this.cachedServices[adapter] = this.createServicesForAdapter(adapter);
    }
    return this.cachedServices[adapter] as ServiceBundle;
  }

  public getBackendAdapter(): BackendAdapter {
    return this.getConfiguredBackendAdapter();
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
    return this.getServicesForCurrentAdapter().adService;
  }

  /**
   * Get Team Service based on environment
   */
  public getTeamService(): TeamServiceInterface {
    return this.getServicesForCurrentAdapter().teamService;
  }

  /**
   * Get User Service based on environment
   */
  public getUserService(): UserServiceInterface {
    return this.getServicesForCurrentAdapter().userService;
  }

  // Utility method to get all services at once
  public getServices() {
    return this.getServicesForCurrentAdapter();
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
    mode: "mock" | "live";
    services: {
      ad: boolean;
      team: boolean;
      user: boolean;
    };
    timestamp: string;
  }> {
    const mode = isMockMode() ? "mock" : "live";
    
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

