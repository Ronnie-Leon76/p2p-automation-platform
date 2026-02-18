/**
 * Verification Service
 * Handles email and phone number verification functionality
 */

import { getBrowserDbClient } from "@/lib/composition/browser-db-composer";

export interface VerificationStatus {
  email: {
    verified: boolean;
    verificationSent: boolean;
    lastSentAt?: string;
  };
  phone: {
    verified: boolean;
    verificationSent: boolean;
    lastSentAt?: string;
    number?: string;
  };
}

export interface VerificationResult {
  success: boolean;
  message: string;
  error?: string;
}

export class VerificationService {
  private supabase = getBrowserDbClient();

  /**
   * Get current verification status for user
   */
  async getVerificationStatus(userId: string): Promise<VerificationStatus> {
    try {
      // Get user from Supabase auth
      const { data: authUser } = await this.supabase.auth.getUser();
      
      // Get user profile from database
      const { data: userProfile, error } = await this.supabase
        .from('users')
        .select('email_verified, phone')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Could not fetch user verification status:', error);
      }

      return {
        email: {
          verified: authUser?.user?.email_confirmed_at != null || userProfile?.email_verified || false,
          verificationSent: false, // This would be tracked in a separate table
        },
        phone: {
          verified: authUser?.user?.phone_confirmed_at != null || false,
          verificationSent: false, // This would be tracked in a separate table
          number: authUser?.user?.phone || undefined,
        },
      };
    } catch (error) {
      console.error('Error getting verification status:', error);
      return {
        email: { verified: false, verificationSent: false },
        phone: { verified: false, verificationSent: false },
      };
    }
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(): Promise<VerificationResult> {
    try {
      const { error } = await this.supabase.auth.resend({
        type: 'signup',
        email: (await this.supabase.auth.getUser()).data.user?.email || '',
      });

      if (error) {
        return {
          success: false,
          message: 'Failed to send email verification',
          error: error.message,
        };
      }

      return {
        success: true,
        message: 'Email verification sent! Please check your inbox.',
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'An error occurred while sending email verification',
        error: error.message,
      };
    }
  }

  /**
   * Send phone verification (placeholder for future implementation)
   */
  async sendPhoneVerification(phoneNumber: string): Promise<VerificationResult> {
    try {
      // In a real implementation, this would use Supabase phone auth
      // or a third-party service like Twilio
      
      // For now, return a placeholder response
      console.log('Phone verification would be sent to:', phoneNumber);
      
      return {
        success: true,
        message: `Verification code would be sent to ${phoneNumber} (Feature coming soon)`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Phone verification is not yet implemented',
        error: error.message,
      };
    }
  }

  /**
   * Verify phone code (placeholder for future implementation)
   */
  async verifyPhoneCode(phoneNumber: string, code: string): Promise<VerificationResult> {
    try {
      // In a real implementation, this would verify the SMS code
      // For now, return a placeholder response
      console.log('Phone verification code would be verified:', { phoneNumber, code });
      
      return {
        success: true,
        message: 'Phone verification successful! (Mock implementation)',
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Phone verification failed',
        error: error.message,
      };
    }
  }

  /**
   * Update phone number
   */
  async updatePhoneNumber(phoneNumber: string): Promise<VerificationResult> {
    try {
      const { error } = await this.supabase.auth.updateUser({
        phone: phoneNumber,
      });

      if (error) {
        return {
          success: false,
          message: 'Failed to update phone number',
          error: error.message,
        };
      }

      return {
        success: true,
        message: 'Phone number updated successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'An error occurred while updating phone number',
        error: error.message,
      };
    }
  }

  /**
   * Check if user needs verification for sensitive operations
   */
  isVerificationRequired(status: VerificationStatus): boolean {
    // In production, you might require both email and phone verification
    // For now, we'll just require email verification
    return !status.email.verified;
  }

  /**
   * Get verification requirements for production
   */
  getVerificationRequirements(): {
    email: { required: boolean; description: string };
    phone: { required: boolean; description: string };
  } {
    return {
      email: {
        required: true,
        description: 'Email verification is required for account security and notifications',
      },
      phone: {
        required: false, // Set to true in production
        description: 'Phone verification provides additional security for your account',
      },
    };
  }
}

export const verificationService = new VerificationService();

