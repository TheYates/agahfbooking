/**
 * JWT-Based OTP Service
 *
 * This service manages OTP generation and verification using JWT tokens
 * instead of database storage. More efficient and secure.
 */

import jwt from "jsonwebtoken";
import crypto from "crypto";

export interface OTPTokenData {
  xNumber: string;
  otp: string;
  expiresAt: number;
  nonce: string; // Prevents replay attacks
  mode: "hubtel" | "mock";
  generatedAt: number;
}

export interface OTPVerificationResult {
  isValid: boolean;
  error?: string;
  xNumber?: string;
  mode?: "hubtel" | "mock";
}

export interface OTPGenerationResult {
  otp: string;
  token: string;
  expiresAt: number;
  mode: "hubtel" | "mock";
}

class JWTOTPService {
  private readonly JWT_SECRET: string;
  private readonly OTP_EXPIRY_MINUTES = 10;

  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key";

    if (!process.env.JWT_SECRET) {
      console.warn(
        "⚠️ JWT_SECRET not set in environment variables. Using fallback secret."
      );
    }
  }

  /**
   * Generate OTP and create JWT token
   */
  generateOTP(
    xNumber: string,
    mode: "hubtel" | "mock" = "mock"
  ): OTPGenerationResult {
    // Generate random OTP for both modes (no more static OTP)
    const otp = this.generateRandomOTP();

    const now = Date.now();
    const expiresAt = now + this.OTP_EXPIRY_MINUTES * 60 * 1000;

    const tokenData: OTPTokenData = {
      xNumber,
      otp,
      expiresAt,
      nonce: crypto.randomUUID(),
      mode,
      generatedAt: now,
    };

    // Create JWT token
    const token = jwt.sign(tokenData, this.JWT_SECRET, {
      expiresIn: `${this.OTP_EXPIRY_MINUTES}m`,
      issuer: "agahf-booking-system",
      subject: "otp-verification",
    });

    console.log(`🔐 JWT OTP Generated: ${otp} for ${xNumber} (${mode} mode)`);
    console.log(`⏰ Expires at: ${new Date(expiresAt).toISOString()}`);

    return {
      otp,
      token,
      expiresAt,
      mode,
    };
  }

  /**
   * Verify OTP using JWT token
   */
  verifyOTP(token: string, userEnteredOTP: string): OTPVerificationResult {
    try {
      // Verify and decode JWT
      const decoded = jwt.verify(token, this.JWT_SECRET, {
        issuer: "agahf-booking-system",
        subject: "otp-verification",
      }) as OTPTokenData;

      // Check if OTP matches
      if (decoded.otp !== userEnteredOTP) {
        return {
          isValid: false,
          error: "Invalid OTP code",
        };
      }

      // Check if token is expired (double check)
      if (decoded.expiresAt < Date.now()) {
        return {
          isValid: false,
          error: "OTP has expired",
        };
      }

      console.log(
        `✅ JWT OTP Verified: ${userEnteredOTP} for ${decoded.xNumber} (${decoded.mode} mode)`
      );

      return {
        isValid: true,
        xNumber: decoded.xNumber,
        mode: decoded.mode,
      };
    } catch (error) {
      console.error("JWT OTP verification error:", error);

      if (error instanceof jwt.TokenExpiredError) {
        return {
          isValid: false,
          error: "OTP has expired",
        };
      }

      if (error instanceof jwt.JsonWebTokenError) {
        return {
          isValid: false,
          error: "Invalid OTP token",
        };
      }

      return {
        isValid: false,
        error: "OTP verification failed",
      };
    }
  }

  /**
   * Generate random 6-digit OTP
   */
  private generateRandomOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Decode JWT token without verification (for debugging)
   */
  decodeToken(token: string): OTPTokenData | null {
    try {
      return jwt.decode(token) as OTPTokenData;
    } catch (error) {
      console.error("Token decode error:", error);
      return null;
    }
  }

  /**
   * Check if token is expired without verification
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded) return true;

      return decoded.expiresAt < Date.now();
    } catch (error) {
      return true;
    }
  }

  /**
   * Get token expiration time
   */
  getTokenExpiration(token: string): Date | null {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded) return null;

      return new Date(decoded.expiresAt);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get remaining time for token in seconds
   */
  getRemainingTime(token: string): number {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded) return 0;

      const remaining = Math.max(0, decoded.expiresAt - Date.now());
      return Math.floor(remaining / 1000);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Validate JWT secret configuration
   */
  validateConfiguration(): { isValid: boolean; message: string } {
    if (!this.JWT_SECRET || this.JWT_SECRET === "fallback-secret-key") {
      return {
        isValid: false,
        message:
          "JWT_SECRET is not properly configured. Please set a secure secret in environment variables.",
      };
    }

    if (this.JWT_SECRET.length < 32) {
      return {
        isValid: false,
        message:
          "JWT_SECRET is too short. Please use a secret with at least 32 characters.",
      };
    }

    return {
      isValid: true,
      message: "JWT configuration is valid",
    };
  }

  /**
   * Get debug information (development only)
   */
  getDebugInfo(token?: string): any {
    if (process.env.NODE_ENV !== "development") {
      return { message: "Debug info only available in development mode" };
    }

    const config = this.validateConfiguration();
    const info: any = {
      configuration: config,
      otpExpiryMinutes: this.OTP_EXPIRY_MINUTES,
      jwtSecretLength: this.JWT_SECRET.length,
      jwtSecretPreview: this.JWT_SECRET.substring(0, 8) + "...",
    };

    if (token) {
      const decoded = this.decodeToken(token);
      info.tokenInfo = {
        decoded,
        isExpired: this.isTokenExpired(token),
        remainingSeconds: this.getRemainingTime(token),
        expirationDate: this.getTokenExpiration(token),
      };
    }

    return info;
  }

  /**
   * Create a test token for development
   */
  createTestToken(
    xNumber: string = "X12345/67",
    mode: "hubtel" | "mock" = "mock"
  ): OTPGenerationResult {
    if (process.env.NODE_ENV !== "development") {
      throw new Error("Test tokens can only be created in development mode");
    }

    return this.generateOTP(xNumber, mode);
  }
}

// Export singleton instance
export const jwtOTPService = new JWTOTPService();

// Export class for testing
export { JWTOTPService };

// Export types
export type { OTPTokenData, OTPVerificationResult, OTPGenerationResult };
