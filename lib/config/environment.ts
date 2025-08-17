/**
 * Environment Configuration Manager
 * Handles different environments: mock, local dev, and production
 */

export type EnvironmentMode = 'mock' | 'local' | 'production';

export interface EnvironmentConfig {
  mode: EnvironmentMode;
  database: {
    url: string;
    anonKey: string;
    serviceRoleKey?: string;
  };
  features: {
    mockAuth: boolean;
    realTimeUpdates: boolean;
    emailNotifications: boolean;
    analytics: boolean;
    fileUploads: boolean;
  };
  api: {
    baseUrl: string;
    timeout: number;
  };
  ui: {
    showDebugInfo: boolean;
    enableDevTools: boolean;
  };
}

class EnvironmentManager {
  private static instance: EnvironmentManager;
  private currentConfig: EnvironmentConfig;

  private constructor() {
    this.currentConfig = this.detectEnvironment();
  }

  public static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  /**
   * Detect current environment based on environment variables
   */
  private detectEnvironment(): EnvironmentConfig {
    const mode = this.getEnvironmentMode();
    
    switch (mode) {
      case 'mock':
        return this.getMockConfig();
      case 'local':
        return this.getLocalConfig();
      case 'production':
        return this.getProductionConfig();
      default:
        console.warn(`Unknown environment mode: ${mode}, defaulting to mock`);
        return this.getMockConfig();
    }
  }

  /**
   * Determine environment mode from environment variables
   */
  private getEnvironmentMode(): EnvironmentMode {
    // Priority order: explicit NEXT_PUBLIC_ENVIRONMENT, then USE_MOCK_DATA, then NODE_ENV
    const explicitEnv = process.env.NEXT_PUBLIC_ENVIRONMENT;
    if (explicitEnv === 'mock' || explicitEnv === 'local' || explicitEnv === 'production') {
      return explicitEnv as EnvironmentMode;
    }

    // Check if mock data is explicitly enabled
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
      return 'mock';
    }

    // Check if we have local Supabase URLs
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && (supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1'))) {
      return 'local';
    }

    // Default based on NODE_ENV
    if (process.env.NODE_ENV === 'production') {
      return 'production';
    }

    // Default to mock for development
    return 'mock';
  }

  /**
   * Mock environment configuration
   */
  private getMockConfig(): EnvironmentConfig {
    return {
      mode: 'mock',
      database: {
        url: 'mock://localhost',
        anonKey: 'mock-anon-key',
      },
      features: {
        mockAuth: true,
        realTimeUpdates: false,
        emailNotifications: false,
        analytics: false,
        fileUploads: false,
      },
      api: {
        baseUrl: 'http://localhost:3000',
        timeout: 1000, // Fast mock responses
      },
      ui: {
        showDebugInfo: true,
        enableDevTools: true,
      },
    };
  }

  /**
   * Local Supabase environment configuration
   */
  private getLocalConfig(): EnvironmentConfig {
    return {
      mode: 'local',
      database: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:55321',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
      features: {
        mockAuth: false,
        realTimeUpdates: true,
        emailNotifications: true,
        analytics: false, // Disabled for local dev
        fileUploads: true,
      },
      api: {
        baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        timeout: 5000,
      },
      ui: {
        showDebugInfo: true,
        enableDevTools: true,
      },
    };
  }

  /**
   * Production environment configuration
   */
  private getProductionConfig(): EnvironmentConfig {
    return {
      mode: 'production',
      database: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
      features: {
        mockAuth: false,
        realTimeUpdates: true,
        emailNotifications: true,
        analytics: true,
        fileUploads: true,
      },
      api: {
        baseUrl: process.env.NEXT_PUBLIC_APP_URL || '',
        timeout: 10000,
      },
      ui: {
        showDebugInfo: false,
        enableDevTools: false,
      },
    };
  }

  /**
   * Get current environment configuration
   */
  public getConfig(): EnvironmentConfig {
    return this.currentConfig;
  }

  /**
   * Get current environment mode
   */
  public getMode(): EnvironmentMode {
    return this.currentConfig.mode;
  }

  /**
   * Check if using mock data
   */
  public isMockMode(): boolean {
    return this.currentConfig.mode === 'mock';
  }

  /**
   * Check if using local Supabase
   */
  public isLocalMode(): boolean {
    return this.currentConfig.mode === 'local';
  }

  /**
   * Check if in production
   */
  public isProductionMode(): boolean {
    return this.currentConfig.mode === 'production';
  }

  /**
   * Switch environment mode (development only)
   */
  public switchMode(mode: EnvironmentMode): void {
    if (process.env.NODE_ENV === 'production') {
      console.warn('Cannot switch environment mode in production');
      return;
    }

    switch (mode) {
      case 'mock':
        this.currentConfig = this.getMockConfig();
        break;
      case 'local':
        this.currentConfig = this.getLocalConfig();
        break;
      case 'production':
        this.currentConfig = this.getProductionConfig();
        break;
    }

    // Store preference in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('dev_environment_mode', mode);
    }

    console.log(`🔄 Switched to ${mode} environment mode`);
  }

  /**
   * Validate current configuration
   */
  public validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config = this.currentConfig;

    // Validate database config for non-mock modes
    if (config.mode !== 'mock') {
      if (!config.database.url) {
        errors.push('Database URL is missing');
      }
      if (!config.database.anonKey) {
        errors.push('Database anon key is missing');
      }
    }

    // Validate API config
    if (!config.api.baseUrl) {
      errors.push('API base URL is missing');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get debug information
   */
  public getDebugInfo(): Record<string, any> {
    return {
      mode: this.currentConfig.mode,
      nodeEnv: process.env.NODE_ENV,
      explicitEnv: process.env.NEXT_PUBLIC_ENVIRONMENT,
      useMockData: process.env.NEXT_PUBLIC_USE_MOCK_DATA,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      features: this.currentConfig.features,
      validation: this.validateConfig(),
    };
  }
}

// Export singleton instance
export const environmentManager = EnvironmentManager.getInstance();

// Helper functions for convenience
export const getEnvironmentConfig = () => environmentManager.getConfig();
export const getEnvironmentMode = () => environmentManager.getMode();
export const isMockMode = () => environmentManager.isMockMode();
export const isLocalMode = () => environmentManager.isLocalMode();
export const isProductionMode = () => environmentManager.isProductionMode();
