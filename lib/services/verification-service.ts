/**
 * Verification Service
 * Handles email and phone number verification functionality
 */

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
  /**
   * Get current verification status for user
   */
  async getVerificationStatus(_userId: string): Promise<VerificationStatus> {
    try {
      const response = await fetch("/api/verification/status", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        return {
          email: { verified: false, verificationSent: false },
          phone: { verified: false, verificationSent: false },
        };
      }

      return await response.json();
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
      const response = await fetch("/api/verification/email", {
        method: "POST",
        credentials: "include",
      });
      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        return {
          success: false,
          message: 'Failed to send email verification',
          error: payload?.error || "Unknown error",
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
      const response = await fetch("/api/verification/phone", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", phoneNumber }),
      });
      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        return {
          success: false,
          message: payload?.error || "Phone verification is not yet implemented",
          error: payload?.error,
        };
      }

      return {
        success: true,
        message: payload?.message || `Verification code would be sent to ${phoneNumber} (Feature coming soon)`,
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
      const response = await fetch("/api/verification/phone", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", phoneNumber, code }),
      });
      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        return {
          success: false,
          message: payload?.error || "Phone verification failed",
          error: payload?.error,
        };
      }

      return {
        success: true,
        message: payload?.message || "Phone verification successful! (Mock implementation)",
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
      const response = await fetch("/api/verification/phone", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", phoneNumber }),
      });
      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        return {
          success: false,
          message: 'Failed to update phone number',
          error: payload?.error || "Unknown error",
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

