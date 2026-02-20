export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  userType?: "merchant" | "member";
}

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SecurityEvent {
  userId: string;
  eventType: string;
  eventDescription: string;
  ipAddress?: string;
  userAgent?: string;
  riskLevel?: "low" | "medium" | "high" | "critical";
  metadata?: Record<string, any>;
}

export interface UserSession {
  id: string;
  userId: string;
  sessionToken: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
}

export class SecureAuthService {
  private readonly adapter = (process.env.NEXT_PUBLIC_BACKEND_ADAPTER ?? "postgres").toLowerCase();

  private getAuthBaseUrl(): string {
    return "/api/auth";
  }

  private mapAuthNetworkError(error: unknown): Error {
    if (error instanceof TypeError && /Failed to fetch/i.test(error.message)) {
      return new Error(
        `Cannot reach auth backend at ${this.getAuthBaseUrl()}. Check your auth adapter configuration and server status.`
      );
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error("Unknown authentication error");
  }

  private async readApiError(response: Response, fallback: string): Promise<never> {
    let message = fallback;
    try {
      const payload = await response.json();
      message = payload?.message || payload?.error?.message || payload?.error || fallback;
    } catch {
      message = fallback;
    }
    throw new Error(message);
  }

  async register(data: RegisterData) {
    try {
      this.validatePasswordStrength(data.password);

      const response = await fetch("/api/auth/sign-up/email", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: data.fullName,
        }),
      });

      if (!response.ok) {
        await this.readApiError(response, "Failed to create account");
      }

      const payload = await response.json();
      if (!payload?.user) {
        throw new Error("User creation failed");
      }

      return {
        user: payload.user,
        session: payload.token ? { access_token: payload.token } : null,
        needsEmailVerification: false,
      };
    } catch (error) {
      const mappedError = this.mapAuthNetworkError(error);
      throw mappedError;
    }
  }

  async login(data: LoginData, ipAddress?: string, userAgent?: string) {
    try {
      const response = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          rememberMe: data.rememberMe ?? false,
        }),
      });

      if (!response.ok) {
        await this.readApiError(response, "Login failed");
      }

      const payload = await response.json();
      if (!payload?.user) {
        throw new Error("Login failed. Please try again.");
      }

      return {
        user: payload.user,
        session: payload.token ? { access_token: payload.token } : null,
      };
    } catch (error) {
      const mappedError = this.mapAuthNetworkError(error);
      throw mappedError;
    }
  }

  async logout(sessionToken?: string) {
    const response = await fetch("/api/auth/sign-out", {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      await this.readApiError(response, "Logout failed");
    }

    return { success: true };
  }

  async sendPasswordReset(_email: string) {
    throw new Error("Password reset is not implemented yet.");
  }

  async changePassword(_userId: string, _currentPassword: string, _newPassword: string) {
    throw new Error("Password change is not implemented yet.");
  }

  async enableTwoFactor(_userId: string) {
    throw new Error("Two-factor setup is not implemented yet.");
  }

  async getSecurityAuditLog(_userId: string, _limit = 50) {
    throw new Error("Security audit log is not implemented yet.");
  }

  async getActiveSessions(_userId: string) {
    throw new Error("Active session listing is not implemented yet.");
  }

  async revokeSession(_userId: string, _sessionId: string) {
    throw new Error("Session revoke is not implemented yet.");
  }

  private validatePasswordStrength(password: string) {
    const minLength = 12;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      throw new Error(`Password must be at least ${minLength} characters long`);
    }

    if (!hasUpperCase) {
      throw new Error("Password must contain at least one uppercase letter");
    }

    if (!hasLowerCase) {
      throw new Error("Password must contain at least one lowercase letter");
    }

    if (!hasNumbers) {
      throw new Error("Password must contain at least one number");
    }

    if (!hasSpecialChar) {
      throw new Error("Password must contain at least one special character");
    }
  }

  private async updateLastLogin(_userId: string, _ipAddress?: string) {}

  private async logSecurityEvent(_event: SecurityEvent) {}
}
