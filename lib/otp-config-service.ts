/**
 * OTP Configuration Service
 *
 * This service manages the configuration for OTP sending,
 * allowing switching between Hubtel SMS and Mock OTP services.
 */

import { hubtelSMS } from "./hubtel-sms";
import { mockOTPService } from "./mock-otp-service";
import { SystemSettingsService } from "./db-services";

export type OTPMode = "hubtel" | "mock";

export interface OTPResponse {
  status: "success" | "error";
  message: string;
  data?: any;
  errors?: string[];
}

export interface OTPConfig {
  mode: OTPMode;
  hubtelEnabled: boolean;
  mockEnabled: boolean;
  defaultMode: OTPMode;
}

class OTPConfigService {
  private currentMode: OTPMode | null = null;
  private readonly DEFAULT_MODE: OTPMode = "mock"; // Default to mock for development
  private readonly SETTING_KEY = "otp_mode";

  constructor() {
    // Mode will be loaded from database when needed
  }

  /**
   * Get initial OTP mode from database, environment, or default
   */
  private async getInitialMode(): Promise<OTPMode> {
    // First try to load from database
    try {
      const savedMode = await SystemSettingsService.get(this.SETTING_KEY);
      if (savedMode === "hubtel" || savedMode === "mock") {
        return savedMode as OTPMode;
      }
    } catch (error) {
      console.warn("Could not load OTP mode from database:", error);
    }

    // Fallback to environment variable
    const envMode = process.env.OTP_MODE as OTPMode;
    if (envMode === "hubtel" || envMode === "mock") {
      return envMode;
    }

    // Final fallback based on environment
    return process.env.NODE_ENV === "production" ? "hubtel" : this.DEFAULT_MODE;
  }

  /**
   * Load current mode from database if not already loaded
   */
  private async ensureModeLoaded(): Promise<void> {
    if (this.currentMode === null) {
      this.currentMode = await this.getInitialMode();
    }
  }

  /**
   * Get current OTP mode
   */
  async getCurrentMode(): Promise<OTPMode> {
    await this.ensureModeLoaded();
    return this.currentMode!;
  }

  /**
   * Set OTP mode and persist to database
   */
  async setMode(mode: OTPMode, updatedBy?: number): Promise<void> {
    if (mode !== "hubtel" && mode !== "mock") {
      throw new Error('Invalid OTP mode. Must be "hubtel" or "mock"');
    }

    // Save to database
    try {
      await SystemSettingsService.update(
        this.SETTING_KEY,
        mode,
        updatedBy || 1
      );
      this.currentMode = mode;
      console.log(
        `🔧 OTP mode changed to: ${mode.toUpperCase()} and saved to database`
      );
    } catch (error) {
      console.error("Failed to save OTP mode to database:", error);
      throw new Error("Failed to save OTP mode to database");
    }
  }

  /**
   * Get OTP configuration
   */
  async getConfig(): Promise<OTPConfig> {
    await this.ensureModeLoaded();
    return {
      mode: this.currentMode!,
      hubtelEnabled: this.isHubtelConfigured(),
      mockEnabled: true, // Mock is always available
      defaultMode: this.DEFAULT_MODE,
    };
  }

  /**
   * Check if Hubtel is properly configured
   */
  private isHubtelConfigured(): boolean {
    const clientId = process.env.HUBTEL_CLIENT_ID;
    const clientSecret = process.env.HUBTEL_CLIENT_SECRET;
    return !!(clientId && clientSecret);
  }

  /**
   * Send OTP using current mode
   */
  async sendOTP(
    phone: string,
    otp: string,
    hospitalName: string = "AGAHF Hospital"
  ): Promise<OTPResponse> {
    await this.ensureModeLoaded();
    const currentMode = this.currentMode!;
    console.log(`📤 Sending OTP via ${currentMode.toUpperCase()} service`);

    try {
      if (currentMode === "hubtel") {
        return await this.sendHubtelOTP(phone, otp, hospitalName);
      } else {
        return await this.sendMockOTP(phone, otp, hospitalName);
      }
    } catch (error) {
      console.error(`❌ OTP sending failed (${currentMode}):`, error);

      // If Hubtel fails, optionally fallback to mock in development
      if (currentMode === "hubtel" && process.env.NODE_ENV === "development") {
        console.log("🔄 Falling back to mock OTP in development mode");
        return await this.sendMockOTP(phone, otp, hospitalName);
      }

      throw error;
    }
  }

  /**
   * Send OTP via Hubtel
   */
  private async sendHubtelOTP(
    phone: string,
    otp: string,
    hospitalName: string
  ): Promise<OTPResponse> {
    if (!this.isHubtelConfigured()) {
      throw new Error(
        "Hubtel is not configured. Please check HUBTEL_CLIENT_ID and HUBTEL_CLIENT_SECRET environment variables."
      );
    }

    console.log(`📱 Sending real SMS via Hubtel to ${phone}`);
    return await hubtelSMS.sendOTP(phone, otp, hospitalName);
  }

  /**
   * Send OTP via Mock service
   */
  private async sendMockOTP(
    phone: string,
    otp: string,
    hospitalName: string
  ): Promise<OTPResponse> {
    console.log(`🧪 Sending mock SMS to ${phone}`);
    return await mockOTPService.sendOTP(phone, otp, hospitalName);
  }

  /**
   * Send general SMS using current mode
   */
  async sendSMS(params: {
    to: string;
    message: string;
    from?: string;
  }): Promise<OTPResponse> {
    await this.ensureModeLoaded();
    const currentMode = this.currentMode!;
    console.log(`📤 Sending SMS via ${currentMode.toUpperCase()} service`);

    try {
      if (currentMode === "hubtel") {
        return await hubtelSMS.sendSMS(params);
      } else {
        return await mockOTPService.sendSMS(params);
      }
    } catch (error) {
      console.error(`❌ SMS sending failed (${currentMode}):`, error);

      // If Hubtel fails, optionally fallback to mock in development
      if (currentMode === "hubtel" && process.env.NODE_ENV === "development") {
        console.log("🔄 Falling back to mock SMS in development mode");
        return await mockOTPService.sendSMS(params);
      }

      throw error;
    }
  }

  /**
   * Test current OTP service connectivity
   */
  async testConnection(): Promise<{
    success: boolean;
    mode: OTPMode;
    message: string;
  }> {
    await this.ensureModeLoaded();
    const currentMode = this.currentMode!;

    try {
      let success = false;

      if (currentMode === "hubtel") {
        success = await hubtelSMS.testConnection();
      } else {
        success = await mockOTPService.testConnection();
      }

      return {
        success,
        mode: currentMode,
        message: success
          ? `${this.currentMode.toUpperCase()} service is working correctly`
          : `${this.currentMode.toUpperCase()} service test failed`,
      };
    } catch (error) {
      return {
        success: false,
        mode: this.currentMode,
        message: `${this.currentMode.toUpperCase()} service error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  /**
   * Get service status and configuration info
   */
  async getStatus(): Promise<{
    currentMode: OTPMode;
    hubtelConfigured: boolean;
    mockAvailable: boolean;
    environment: string;
    canSwitchToHubtel: boolean;
    canSwitchToMock: boolean;
  }> {
    await this.ensureModeLoaded();
    const hubtelConfigured = this.isHubtelConfigured();

    return {
      currentMode: this.currentMode!,
      hubtelConfigured,
      mockAvailable: true,
      environment: process.env.NODE_ENV || "development",
      canSwitchToHubtel: hubtelConfigured,
      canSwitchToMock: true,
    };
  }

  /**
   * Generate OTP code
   */
  async generateOTP(): Promise<string> {
    await this.ensureModeLoaded();
    if (this.currentMode === "mock") {
      return mockOTPService.generateMockOTP();
    } else {
      // Use standard random OTP for Hubtel
      return Math.floor(100000 + Math.random() * 900000).toString();
    }
  }

  /**
   * Get debug information (development only)
   */
  getDebugInfo(): any {
    if (process.env.NODE_ENV !== "development") {
      return { message: "Debug info only available in development mode" };
    }

    return {
      currentMode: this.currentMode,
      config: this.getConfig(),
      status: this.getStatus(),
      storedMockOTPs:
        this.currentMode === "mock"
          ? mockOTPService.getStoredOTPs()
          : "Not in mock mode",
    };
  }
}

// Export singleton instance
export const otpConfig = new OTPConfigService();

// Export class for testing
export { OTPConfigService };

// Export types
export type { OTPMode, OTPResponse, OTPConfig };
