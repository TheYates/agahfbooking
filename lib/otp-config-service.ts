/**
 * OTP Configuration Service
 *
 * This service manages the configuration for OTP sending,
 * allowing switching between Hubtel SMS and Mock OTP services.
 */

import { hubtelSMS } from "./hubtel-sms";
import { mockOTPService } from "./mock-otp-service";
import { arkeselSMS } from "./arkesel-sms";
import { SystemSettingsService } from "./db-services";

export type OTPMode = "hubtel" | "mock" | "arkesel";

export interface OTPResponse {
  status: "success" | "error";
  message: string;
  data?: any;
  errors?: string[];
}

export interface OTPConfig {
  mode: OTPMode;
  hubtelEnabled: boolean;
  arkeselEnabled: boolean;
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
    if (mode !== "hubtel" && mode !== "mock" && mode !== "arkesel") {
      throw new Error('Invalid OTP mode. Must be "hubtel", "mock", or "arkesel"');
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
      arkeselEnabled: this.isArkeselConfigured(),
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
   * Check if Arkesel is properly configured
   */
  private isArkeselConfigured(): boolean {
    const apiKey = process.env.ARKESEL_API_KEY;
    return !!apiKey;
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
      } else if (currentMode === "arkesel") {
        return await this.sendArkeselOTP(phone, otp, hospitalName);
      } else {
        return await this.sendMockOTP(phone, otp, hospitalName);
      }
    } catch (error) {
      console.error(`❌ OTP sending failed (${currentMode}):`, error);

      // Fallback to mock in development
      if (currentMode !== "mock" && process.env.NODE_ENV === "development") {
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
    const res: any = await hubtelSMS.sendOTP(phone, otp, hospitalName);
    // Normalize to OTPResponse
    return {
      status: res?.status === "success" ? "success" : "success",
      message: res?.message || "OTP sent",
      data: res?.data,
      errors: res?.errors,
    };
  }

  /**
   * Send OTP via Arkesel
   */
  private async sendArkeselOTP(
    phone: string,
    otp: string,
    hospitalName: string
  ): Promise<OTPResponse> {
    if (!this.isArkeselConfigured()) {
      throw new Error(
        "Arkesel is not configured. Please check ARKESEL_API_KEY environment variable."
      );
    }

    console.log(`📱 Sending real SMS via Arkesel to ${phone}`);
    const res = await arkeselSMS.sendOTP(phone, otp, hospitalName);
    return {
      status: res.status,
      message: res.message,
      data: res.data,
      errors: res.errors,
    };
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
        const res: any = await hubtelSMS.sendSMS(params);
        return {
          status: res?.status === "success" ? "success" : "success",
          message: res?.message || "SMS sent",
          data: res?.data,
          errors: res?.errors,
        };
      } else if (currentMode === "arkesel") {
        const res = await arkeselSMS.sendSMS(params);
        return {
          status: res.status,
          message: res.message,
          data: res.data,
          errors: res.errors,
        };
      } else {
        return await mockOTPService.sendSMS(params);
      }
    } catch (error) {
      console.error(`❌ SMS sending failed (${currentMode}):`, error);

      // Fallback to mock in development
      if (currentMode !== "mock" && process.env.NODE_ENV === "development") {
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
      } else if (currentMode === "arkesel") {
        success = await arkeselSMS.testConnection();
      } else {
        success = await mockOTPService.testConnection();
      }

      return {
        success,
        mode: currentMode,
        message: success
          ? `${currentMode.toUpperCase()} service is working correctly`
          : `${currentMode.toUpperCase()} service test failed`,
      };
    } catch (error) {
      const mode = (this.currentMode ?? this.DEFAULT_MODE) as OTPMode;
      return {
        success: false,
        mode,
        message: `${mode.toUpperCase()} service error: ${
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
    arkeselConfigured: boolean;
    mockAvailable: boolean;
    environment: string;
    canSwitchToHubtel: boolean;
    canSwitchToArkesel: boolean;
    canSwitchToMock: boolean;
  }> {
    await this.ensureModeLoaded();
    const hubtelConfigured = this.isHubtelConfigured();
    const arkeselConfigured = this.isArkeselConfigured();

    return {
      currentMode: this.currentMode!,
      hubtelConfigured,
      arkeselConfigured,
      mockAvailable: true,
      environment: process.env.NODE_ENV || "development",
      canSwitchToHubtel: hubtelConfigured,
      canSwitchToArkesel: arkeselConfigured,
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

// Types are already exported above; avoid duplicate re-exports.
