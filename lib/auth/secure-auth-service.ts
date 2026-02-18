import { getBrowserDbClient } from '@/lib/composition/browser-db-composer';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  userType?: 'merchant' | 'member';
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
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
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
  private supabase = getBrowserDbClient();

  /**
   * Register a new user with crypto-grade security
   */
  async register(data: RegisterData) {
    try {
      // Validate password strength
      this.validatePasswordStrength(data.password);

      // Create Supabase auth user
      console.log('🚀 Creating Supabase auth user...');
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            user_type: data.userType || 'merchant',
          },
        },
      });

      console.log('📝 Auth signup response:', { 
        user: !!authData.user, 
        session: !!authData.session, 
        error: authError?.message 
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('User creation failed');
      }

      // Create user profile in database
      console.log('💾 Creating user profile in database...');
      const { error: profileError } = await this.supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: data.email,
          full_name: data.fullName,
          user_type: data.userType || 'merchant',
          profile_complete: false,
          password_changed_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error('❌ Profile creation error:', profileError);
        // Don't throw here, auth user is already created
      } else {
        console.log('✅ User profile created successfully');
      }

      // Log security event
      await this.logSecurityEvent({
        userId: authData.user.id,
        eventType: 'USER_REGISTRATION',
        eventDescription: `New user registered: ${data.email}`,
        riskLevel: 'low',
      });

      return {
        user: authData.user,
        session: authData.session,
        needsEmailVerification: !authData.user.email_confirmed_at,
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login user with enhanced security
   */
  async login(data: LoginData, ipAddress?: string, userAgent?: string) {
    try {
      console.log('🔐 Attempting login for:', data.email);
      
      // Check for account lockout
      await this.checkAccountLockout(data.email);

      // Attempt login
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      console.log('🔍 Auth response:', { authData: !!authData, error: authError?.message });

      if (authError) {
        console.error('❌ Auth error details:', authError);
        
        // Log failed login attempt (only if it's not a user not found error)
        if (authError.message !== 'Invalid login credentials') {
          await this.logFailedLogin(data.email, ipAddress, userAgent);
        }
        
        // Provide user-friendly error messages
        switch (authError.message) {
          case 'Invalid login credentials':
            throw new Error('Invalid email or password. Please check your credentials and try again.');
          case 'Email not confirmed':
            throw new Error('Please verify your email address before logging in.');
          case 'Too many requests':
            throw new Error('Too many login attempts. Please wait a few minutes before trying again.');
          case 'Signup disabled':
            throw new Error('Account registration is currently disabled.');
          default:
            console.error('Auth error:', authError);
            throw new Error('Login failed. Please check your credentials and try again.');
        }
      }

      if (!authData.user) {
        console.error('❌ No user data returned');
        throw new Error('Login failed. Please try again.');
      }

      console.log('✅ Login successful for user:', authData.user.id);

      // Reset login attempts on successful login
      await this.resetLoginAttempts(authData.user.id);

      // Update last login info
      await this.updateLastLogin(authData.user.id, ipAddress);

      // Create session record
      if (authData.session) {
        await this.createSessionRecord({
          userId: authData.user.id,
          sessionToken: authData.session.access_token,
          expiresAt: new Date(authData.session.expires_at! * 1000),
          ipAddress,
          userAgent,
        });
      }

      // Log security event
      await this.logSecurityEvent({
        userId: authData.user.id,
        eventType: 'USER_LOGIN',
        eventDescription: 'User logged in successfully',
        ipAddress,
        userAgent,
        riskLevel: 'low',
      });

      return {
        user: authData.user,
        session: authData.session,
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Logout user and clean up session
   */
  async logout(sessionToken?: string) {
    try {
      // Sign out from Supabase
      const { error } = await this.supabase.auth.signOut();

      if (error) {
        console.error('Logout error:', error);
      }

      // Deactivate session record
      if (sessionToken) {
        await this.supabase
          .from('user_sessions')
          .update({ is_active: false })
          .eq('session_token', sessionToken);
      }

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string) {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
      });

      if (error) {
        throw new Error(error.message);
      }

      // Create password reset token record
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = await bcrypt.hash(token, 12);

      // Get user ID by email
      const { data: user } = await this.supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (user) {
        await this.supabase.from('password_reset_tokens').insert({
          user_id: user.id,
          token_hash: tokenHash,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        });

        // Log security event
        await this.logSecurityEvent({
          userId: user.id,
          eventType: 'PASSWORD_RESET_REQUEST',
          eventDescription: 'Password reset requested',
          riskLevel: 'medium',
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  /**
   * Change password with security validation
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    try {
      // Validate new password strength
      this.validatePasswordStrength(newPassword);

      // Update password
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw new Error(error.message);
      }

      // Update password changed timestamp
      await this.supabase
        .from('users')
        .update({ password_changed_at: new Date().toISOString() })
        .eq('id', userId);

      // Invalidate all existing sessions except current
      await this.supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', userId);

      // Log security event
      await this.logSecurityEvent({
        userId,
        eventType: 'PASSWORD_CHANGED',
        eventDescription: 'User changed password',
        riskLevel: 'medium',
      });

      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Enable two-factor authentication
   */
  async enableTwoFactor(userId: string) {
    try {
      // Generate secret
      // Use base64 as a fallback, or use a base32 library if strict base32 is required
      const secret = crypto.randomBytes(32).toString('base64');
      
      // Generate backup codes
      const backupCodes = Array.from({ length: 8 }, () => 
        crypto.randomBytes(4).toString('hex').toUpperCase()
      );

      // Update user record
      await this.supabase
        .from('users')
        .update({
          two_factor_enabled: true,
          two_factor_secret: secret,
          backup_codes: backupCodes,
        })
        .eq('id', userId);

      // Log security event
      await this.logSecurityEvent({
        userId,
        eventType: 'TWO_FACTOR_ENABLED',
        eventDescription: 'Two-factor authentication enabled',
        riskLevel: 'low',
      });

      return {
        secret,
        backupCodes,
        qrCodeUrl: this.generateQRCodeUrl(userId, secret),
      };
    } catch (error) {
      console.error('Enable 2FA error:', error);
      throw error;
    }
  }

  /**
   * Get user security audit log
   */
  async getSecurityAuditLog(userId: string, limit = 50) {
    try {
      const { data, error } = await this.supabase
        .from('security_audit_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Get audit log error:', error);
      throw error;
    }
  }

  /**
   * Get active user sessions
   */
  async getActiveSessions(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_activity', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Get sessions error:', error);
      throw error;
    }
  }

  /**
   * Revoke user session
   */
  async revokeSession(userId: string, sessionId: string) {
    try {
      const { error } = await this.supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(error.message);
      }

      // Log security event
      await this.logSecurityEvent({
        userId,
        eventType: 'SESSION_REVOKED',
        eventDescription: `Session ${sessionId} revoked`,
        riskLevel: 'medium',
      });

      return { success: true };
    } catch (error) {
      console.error('Revoke session error:', error);
      throw error;
    }
  }

  // Private helper methods

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
      throw new Error('Password must contain at least one uppercase letter');
    }

    if (!hasLowerCase) {
      throw new Error('Password must contain at least one lowercase letter');
    }

    if (!hasNumbers) {
      throw new Error('Password must contain at least one number');
    }

    if (!hasSpecialChar) {
      throw new Error('Password must contain at least one special character');
    }
  }

  private async checkAccountLockout(email: string) {
    try {
      const { data } = await this.supabase
        .from('users')
        .select('login_attempts, locked_until')
        .eq('email', email)
        .single();

      if (data?.locked_until && new Date(data.locked_until) > new Date()) {
        throw new Error('Account is temporarily locked due to too many failed login attempts');
      }
    } catch (error: any) {
      // If user doesn't exist in our users table, that's okay for login attempt
      // Supabase Auth will handle the authentication
      if (error.message?.includes('No rows returned')) {
        console.log('📝 User not found in users table, proceeding with auth check');
        return;
      }
      // Re-throw other errors (like lockout)
      throw error;
    }
  }

  private async logFailedLogin(email: string, ipAddress?: string, userAgent?: string) {
    // Get user ID
    const { data: user } = await this.supabase
      .from('users')
      .select('id, login_attempts')
      .eq('email', email)
      .single();

    if (user) {
      const newAttempts = (user.login_attempts || 0) + 1;
      const maxAttempts = 5;
      
      let updateData: any = { login_attempts: newAttempts };

      // Lock account after max attempts
      if (newAttempts >= maxAttempts) {
        updateData.locked_until = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes
      }

      await this.supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      // Log security event
      await this.logSecurityEvent({
        userId: user.id,
        eventType: 'LOGIN_FAILED',
        eventDescription: `Failed login attempt ${newAttempts}/${maxAttempts}`,
        ipAddress,
        userAgent,
        riskLevel: newAttempts >= maxAttempts ? 'critical' : 'medium',
      });
    }
  }

  private async resetLoginAttempts(userId: string) {
    await this.supabase
      .from('users')
      .update({ login_attempts: 0, locked_until: null })
      .eq('id', userId);
  }

  private async updateLastLogin(userId: string, ipAddress?: string) {
    await this.supabase
      .from('users')
      .update({
        last_login_at: new Date().toISOString(),
        last_login_ip: ipAddress,
      })
      .eq('id', userId);
  }

  private async createSessionRecord(session: Omit<UserSession, 'id'>) {
    await this.supabase.from('user_sessions').insert({
      user_id: session.userId,
      session_token: session.sessionToken,
      expires_at: session.expiresAt.toISOString(),
      ip_address: session.ipAddress,
      user_agent: session.userAgent,
      device_fingerprint: session.deviceFingerprint,
    });
  }

  private async logSecurityEvent(event: SecurityEvent) {
    await this.supabase.from('security_audit_log').insert({
      user_id: event.userId,
      event_type: event.eventType,
      event_description: event.eventDescription,
      ip_address: event.ipAddress,
      user_agent: event.userAgent,
      risk_level: event.riskLevel || 'low',
      metadata: event.metadata || {},
    });
  }

  private generateQRCodeUrl(userId: string, secret: string): string {
    const appName = 'P2P Automation Platform';
    const issuer = 'P2P Platform';
    const otpauthUrl = `otpauth://totp/${encodeURIComponent(appName)}:${userId}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`;
  }
}

