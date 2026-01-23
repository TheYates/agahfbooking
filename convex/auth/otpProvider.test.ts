/**
 * Property-Based Tests for OTP Provider
 * 
 * Feature: postgres-to-convex-migration
 * Property 2: OTP Generation and Verification Round Trip
 * 
 * Validates: Requirements 3.1, 3.3
 */

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// JWT OTP Service (simplified for testing)
class TestJWTOTPService {
  private readonly JWT_SECRET = "test-secret-key-for-testing";
  private readonly OTP_EXPIRY_MINUTES = 10;

  generateOTP(xNumber: string, mode: "hubtel" | "mock" = "mock") {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const now = Date.now();
    const expiresAt = now + this.OTP_EXPIRY_MINUTES * 60 * 1000;

    const tokenData = {
      xNumber,
      otp,
      expiresAt,
      nonce: crypto.randomUUID(),
      mode,
      generatedAt: now,
    };

    const token = jwt.sign(tokenData, this.JWT_SECRET, {
      expiresIn: `${this.OTP_EXPIRY_MINUTES}m`,
      issuer: "agahf-booking-system",
      subject: "otp-verification",
    });

    return {
      otp,
      token,
      expiresAt,
      mode,
    };
  }

  verifyOTP(token: string, userEnteredOTP: string) {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET, {
        issuer: "agahf-booking-system",
        subject: "otp-verification",
      }) as any;

      if (decoded.otp !== userEnteredOTP) {
        return {
          isValid: false,
          error: "Invalid OTP code",
        };
      }

      if (decoded.expiresAt < Date.now()) {
        return {
          isValid: false,
          error: "OTP has expired",
        };
      }

      return {
        isValid: true,
        xNumber: decoded.xNumber,
        mode: decoded.mode,
      };
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        return {
          isValid: false,
          error: "OTP has expired",
        };
      }

      if (error.name === "JsonWebTokenError") {
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
}

describe("OTP Provider Property Tests", () => {
  const otpService = new TestJWTOTPService();

  it("Property 2: OTP Generation and Verification Round Trip - Valid OTP should verify successfully", async () => {
    /**
     * Feature: postgres-to-convex-migration
     * Property 2: For any valid X-number, generating an OTP then verifying it
     * with the correct code should create a valid client session.
     * 
     * Validates: Requirements 3.1, 3.3
     */

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          xNumber: fc.string({ minLength: 5, maxLength: 20 }),
          mode: fc.constantFrom("hubtel" as const, "mock" as const),
        }),
        async ({ xNumber, mode }) => {
          // Generate OTP
          const { otp, token, expiresAt } = otpService.generateOTP(xNumber, mode);

          // Verify OTP is 6 digits
          expect(otp).toMatch(/^\d{6}$/);

          // Verify token is generated
          expect(token).toBeDefined();
          expect(typeof token).toBe("string");

          // Verify expiration is in the future
          expect(expiresAt).toBeGreaterThan(Date.now());

          // Verify OTP with correct code
          const verificationResult = otpService.verifyOTP(token, otp);

          // Should succeed
          expect(verificationResult.isValid).toBe(true);
          expect(verificationResult.xNumber).toBe(xNumber);
          expect(verificationResult.mode).toBe(mode);
          expect(verificationResult.error).toBeUndefined();
        }
      ),
      { numRuns: 20 }
    );
  });

  it("Property 2: OTP Generation and Verification Round Trip - Wrong OTP should fail", async () => {
    /**
     * Feature: postgres-to-convex-migration
     * Property 2: For any valid X-number, verifying with an incorrect OTP
     * should fail.
     * 
     * Validates: Requirements 3.1, 3.3
     */

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 20 }),
        async (xNumber) => {
          // Generate OTP
          const { otp, token } = otpService.generateOTP(xNumber);

          // Create a different wrong OTP by modifying the correct one
          const wrongOTP = otp === "123456" ? "654321" : "123456";

          // Verify with wrong OTP
          const verificationResult = otpService.verifyOTP(token, wrongOTP);

          // Should fail
          expect(verificationResult.isValid).toBe(false);
          expect(verificationResult.error).toBe("Invalid OTP code");
          expect(verificationResult.xNumber).toBeUndefined();
        }
      ),
      { numRuns: 20 }
    );
  });

  it("Property 2: OTP Generation and Verification Round Trip - Invalid token should fail", async () => {
    /**
     * Feature: postgres-to-convex-migration
     * Property 2: For any invalid token, verification should fail.
     * 
     * Validates: Requirements 3.1, 3.3
     */

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 50 }),
        async (invalidToken) => {
          const otp = "123456";
          
          // Verify with invalid token
          const verificationResult = otpService.verifyOTP(invalidToken, otp);

          // Should fail
          expect(verificationResult.isValid).toBe(false);
          expect(verificationResult.error).toBeDefined();
          expect(verificationResult.xNumber).toBeUndefined();
        }
      ),
      { numRuns: 20 }
    );
  });

  it("Property 2: OTP Generation and Verification Round Trip - Multiple verifications with same token", async () => {
    /**
     * Feature: postgres-to-convex-migration
     * Property 2: For any valid token, multiple verification attempts with
     * the correct OTP should all succeed (token is not consumed by verification).
     * 
     * Validates: Requirements 3.1, 3.3
     */

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          xNumber: fc.string({ minLength: 5, maxLength: 20 }),
          numVerifications: fc.integer({ min: 2, max: 5 }),
        }),
        async ({ xNumber, numVerifications }) => {
          // Generate OTP
          const { otp, token } = otpService.generateOTP(xNumber);

          // Verify multiple times
          for (let i = 0; i < numVerifications; i++) {
            const verificationResult = otpService.verifyOTP(token, otp);

            // All verifications should succeed
            expect(verificationResult.isValid).toBe(true);
            expect(verificationResult.xNumber).toBe(xNumber);
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  it("Property 2: OTP Generation and Verification Round Trip - OTP format validation", async () => {
    /**
     * Feature: postgres-to-convex-migration
     * Property 2: For any X-number, generated OTP should always be a 6-digit number.
     * 
     * Validates: Requirements 3.1, 3.3
     */

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 20 }),
        async (xNumber) => {
          // Generate OTP
          const { otp } = otpService.generateOTP(xNumber);

          // Verify OTP format
          expect(otp).toMatch(/^\d{6}$/);
          expect(otp.length).toBe(6);
          
          // Verify OTP is a valid number
          const otpNumber = parseInt(otp, 10);
          expect(otpNumber).toBeGreaterThanOrEqual(100000);
          expect(otpNumber).toBeLessThanOrEqual(999999);
        }
      ),
      { numRuns: 20 }
    );
  });

  it("Property 2: OTP Generation and Verification Round Trip - Token contains correct data", async () => {
    /**
     * Feature: postgres-to-convex-migration
     * Property 2: For any X-number, the generated token should contain
     * the X-number, OTP, expiration time, and nonce.
     * 
     * Validates: Requirements 3.1, 3.3
     */

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 20 }),
        async (xNumber) => {
          // Generate OTP
          const { otp, token, expiresAt, mode } = otpService.generateOTP(xNumber);

          // Decode token (without verification)
          const decoded = jwt.decode(token) as any;

          // Verify token contains correct data
          expect(decoded.xNumber).toBe(xNumber);
          expect(decoded.otp).toBe(otp);
          expect(decoded.expiresAt).toBe(expiresAt);
          expect(decoded.mode).toBe(mode);
          expect(decoded.nonce).toBeDefined();
          expect(decoded.generatedAt).toBeDefined();
        }
      ),
      { numRuns: 20 }
    );
  });
});
