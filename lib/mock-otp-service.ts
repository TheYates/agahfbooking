/**
 * Mock OTP Service for Development and Testing
 *
 * This service provides a mock implementation of OTP functionality
 * that doesn't require external SMS services like Hubtel.
 */

export interface MockOTPResponse {
  status: "success" | "error";
  message: string;
  data?: any;
  errors?: string[];
}

export interface MockSendSMSParams {
  to: string;
  message: string;
  from?: string;
}

class MockOTPService {
  private mockOTPs: Map<
    string,
    { otp: string; timestamp: number; phone: string }
  > = new Map();
  private readonly OTP_EXPIRY_MINUTES = 10;

  /**
   * Generate a mock OTP (now returns random OTP)
   */
  generateMockOTP(): string {
    // Always generate random OTP (no more static OTP)
    return this.generateRandomOTP();
  }

  /**
   * Generate a random 6-digit OTP
   */
  private generateRandomOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Store mock OTP for later verification
   */
  private storeMockOTP(phone: string, otp: string): void {
    this.mockOTPs.set(phone, {
      otp,
      timestamp: Date.now(),
      phone,
    });

    // Clean up expired OTPs
    this.cleanupExpiredOTPs();
  }

  /**
   * Clean up expired mock OTPs
   */
  private cleanupExpiredOTPs(): void {
    const now = Date.now();
    const expiryMs = this.OTP_EXPIRY_MINUTES * 60 * 1000;

    for (const [phone, data] of this.mockOTPs.entries()) {
      if (now - data.timestamp > expiryMs) {
        this.mockOTPs.delete(phone);
      }
    }
  }

  /**
   * Verify mock OTP
   */
  verifyMockOTP(phone: string, otp: string): boolean {
    const stored = this.mockOTPs.get(phone);
    if (!stored) {
      return false;
    }

    const now = Date.now();
    const expiryMs = this.OTP_EXPIRY_MINUTES * 60 * 1000;

    // Check if OTP is expired
    if (now - stored.timestamp > expiryMs) {
      this.mockOTPs.delete(phone);
      return false;
    }

    // Check if OTP matches
    if (stored.otp === otp) {
      // Remove OTP after successful verification (one-time use)
      this.mockOTPs.delete(phone);
      return true;
    }

    return false;
  }

  /**
   * Mock SMS sending (logs to console instead of sending real SMS)
   */
  async sendSMS({
    to,
    message,
    from,
  }: MockSendSMSParams): Promise<MockOTPResponse> {
    try {
      const formattedPhone = this.formatPhoneNumber(to);
      const sender = from || "AGAHF-MOCK";

      // Log the "sent" SMS to console
      console.log('\n🔧 MOCK SMS SERVICE - SMS "SENT"');
      console.log("=====================================");
      console.log(`📱 To: ${formattedPhone}`);
      console.log(`👤 From: ${sender}`);
      console.log(`💬 Message: ${message}`);
      console.log("=====================================\n");

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        status: "success",
        message: "Mock SMS sent successfully (logged to console)",
        data: {
          messageId: `mock_${Date.now()}`,
          to: formattedPhone,
          from: sender,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("Mock SMS sending error:", error);
      return {
        status: "error",
        message: "Failed to send mock SMS",
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Send mock OTP SMS
   */
  async sendOTP(
    phone: string,
    otp: string,
    hospitalName: string = "AGAHF Hospital"
  ): Promise<MockOTPResponse> {
    // Store the OTP for later verification
    this.storeMockOTP(phone, otp);

    const message = `[MOCK] Your ${hospitalName} verification code is: ${otp}. This code will expire in ${this.OTP_EXPIRY_MINUTES} minutes. Do not share this code with anyone.`;

    const result = await this.sendSMS({
      to: phone,
      message: message,
    });

    // Add OTP to console log for easy testing
    if (result.status === "success") {
      console.log(`🔐 MOCK OTP GENERATED: ${otp} for ${phone}`);
      console.log(`⏰ Expires in ${this.OTP_EXPIRY_MINUTES} minutes`);
      console.log(`🧪 For testing: Use OTP "${otp}" to verify`);
    }

    return result;
  }

  /**
   * Format phone number (basic formatting)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove any non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, "");

    // Add + if not present and starts with country code
    if (!cleaned.startsWith("+") && cleaned.length > 10) {
      return `+${cleaned}`;
    }

    return cleaned;
  }

  /**
   * Get all stored mock OTPs (for debugging)
   */
  getStoredOTPs(): Array<{
    phone: string;
    otp: string;
    timestamp: number;
    expiresAt: string;
  }> {
    const result = [];
    for (const [phone, data] of this.mockOTPs.entries()) {
      const expiresAt = new Date(
        data.timestamp + this.OTP_EXPIRY_MINUTES * 60 * 1000
      );
      result.push({
        phone,
        otp: data.otp,
        timestamp: data.timestamp,
        expiresAt: expiresAt.toISOString(),
      });
    }
    return result;
  }

  /**
   * Clear all stored mock OTPs
   */
  clearAllOTPs(): void {
    this.mockOTPs.clear();
    console.log("🧹 All mock OTPs cleared");
  }

  /**
   * Test mock SMS connectivity (always returns true)
   */
  async testConnection(): Promise<boolean> {
    console.log("🧪 Mock SMS service connection test - Always successful");
    return true;
  }
}

// Export singleton instance
export const mockOTPService = new MockOTPService();

// Export class for testing
export { MockOTPService };

// Export types
export type { MockOTPResponse, MockSendSMSParams };
