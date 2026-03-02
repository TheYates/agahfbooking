/**
 * Arkesel SMS Service for sending OTP and other messages
 * API Documentation: https://developers.arkesel.com/#tag/One-Time-Password-(OTP)
 */

interface ArkeselSMSResponse {
  status: "success" | "error";
  message: string;
  data?: any;
  errors?: string[];
}

interface SendSMSParams {
  to: string;
  message: string;
  from?: string;
}

interface ArkeselOTPResponse {
  code: string;
  message: string;
  data?: {
    otp_id?: string;
    otp?: string;
  };
}

class ArkeselSMSService {
  private apiKey: string;
  private senderId: string;
  private baseUrl: string = "https://sms.arkesel.com/api/v2";

  constructor() {
    this.apiKey = process.env.ARKESEL_API_KEY || "";
    this.senderId = process.env.ARKESEL_SENDER_ID || "AGAHF";

    if (!this.apiKey) {
      console.warn(
        "Arkesel API key not configured. SMS sending will be disabled."
      );
    }
  }

  /**
   * Format phone number for Ghana (+233 format)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove any spaces, dashes, or other characters
    let cleanPhone = phone.replace(/[\s\-\(\)]/g, "");

    // Handle different Ghana phone number formats
    if (cleanPhone.startsWith("0")) {
      // Convert 0XX XXX XXXX to 233XX XXX XXXX
      cleanPhone = "233" + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith("+233")) {
      // Remove the + sign
      cleanPhone = cleanPhone.substring(1);
    } else if (cleanPhone.startsWith("233")) {
      // Already in correct format
      cleanPhone = cleanPhone;
    } else {
      // Assume it's a local number and add 233
      cleanPhone = "233" + cleanPhone;
    }

    return cleanPhone;
  }

  /**
   * Send SMS via Arkesel API
   */
  async sendSMS({ to, message, from }: SendSMSParams): Promise<ArkeselSMSResponse> {
    try {
      if (!this.apiKey) {
        throw new Error("Arkesel API key not configured");
      }

      const formattedPhone = this.formatPhoneNumber(to);
      const sender = from || this.senderId;

      const payload = {
        sender: sender,
        message: message,
        recipients: [formattedPhone],
      };

      console.log(`[Arkesel] Sending SMS to ${formattedPhone} from ${sender}`);

      const response = await fetch(`${this.baseUrl}/sms/send`, {
        method: "POST",
        headers: {
          "api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      // Arkesel returns status: "success" for successful SMS sends
      if (!response.ok || (responseData.status !== "success" && responseData.code !== "ok")) {
        console.error("[Arkesel] SMS API error:", responseData);
        throw new Error(
          `Arkesel API error: ${responseData.message || "Unknown error"}`
        );
      }

      console.log("[Arkesel] SMS sent successfully:", responseData);

      return {
        status: "success",
        message: "SMS sent successfully",
        data: responseData,
      };
    } catch (error) {
      console.error("[Arkesel] SMS sending error:", error);

      return {
        status: "error",
        message: error instanceof Error ? error.message : "Failed to send SMS",
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Send OTP using Arkesel's dedicated OTP API
   * This uses Arkesel's built-in OTP generation and sending
   */
  async sendOTPViaArkeselAPI(
    phone: string,
    hospitalName: string = "AGAHF Hospital"
  ): Promise<ArkeselSMSResponse & { otp?: string; otpId?: string }> {
    try {
      if (!this.apiKey) {
        throw new Error("Arkesel API key not configured");
      }

      const formattedPhone = this.formatPhoneNumber(phone);

      const payload = {
        expiry: 10, // 10 minutes
        length: 6, // 6-digit OTP
        medium: "sms",
        message: `Your ${hospitalName} verification code is %otp_code%. This code will expire in 10 minutes. Do not share this code with anyone.`,
        number: formattedPhone,
        sender_id: this.senderId,
        type: "numeric",
      };

      console.log(`[Arkesel] Sending OTP to ${formattedPhone}`);

      const response = await fetch(`${this.baseUrl}/otp/generate`, {
        method: "POST",
        headers: {
          "api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseData: ArkeselOTPResponse = await response.json();

      if (!response.ok || responseData.code !== "1100") {
        console.error("[Arkesel] OTP API error:", responseData);
        throw new Error(
          `Arkesel OTP API error: ${responseData.message || "Unknown error"}`
        );
      }

      console.log("[Arkesel] OTP sent successfully");

      return {
        status: "success",
        message: "OTP sent successfully",
        data: responseData.data,
        otpId: responseData.data?.otp_id,
      };
    } catch (error) {
      console.error("[Arkesel] OTP sending error:", error);

      return {
        status: "error",
        message: error instanceof Error ? error.message : "Failed to send OTP",
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Verify OTP using Arkesel's OTP verification API
   */
  async verifyOTPViaArkeselAPI(
    phone: string,
    otp: string
  ): Promise<{ isValid: boolean; message: string }> {
    try {
      if (!this.apiKey) {
        throw new Error("Arkesel API key not configured");
      }

      const formattedPhone = this.formatPhoneNumber(phone);

      const payload = {
        number: formattedPhone,
        code: otp,
      };

      console.log(`[Arkesel] Verifying OTP for ${formattedPhone}`);

      const response = await fetch(`${this.baseUrl}/otp/verify`, {
        method: "POST",
        headers: {
          "api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (responseData.code === "1100") {
        console.log("[Arkesel] OTP verified successfully");
        return {
          isValid: true,
          message: "OTP verified successfully",
        };
      } else {
        console.log("[Arkesel] OTP verification failed:", responseData.message);
        return {
          isValid: false,
          message: responseData.message || "Invalid OTP",
        };
      }
    } catch (error) {
      console.error("[Arkesel] OTP verification error:", error);
      return {
        isValid: false,
        message: error instanceof Error ? error.message : "Verification failed",
      };
    }
  }

  /**
   * Send OTP SMS using Arkesel's dedicated OTP API
   * Falls back to regular SMS if OTP API fails
   */
  async sendOTP(
    phone: string,
    otp: string,
    hospitalName: string = "AGAHF Hospital"
  ): Promise<ArkeselSMSResponse & { generatedOtp?: string }> {
    try {
      if (!this.apiKey) {
        throw new Error("Arkesel API key not configured");
      }

      const formattedPhone = this.formatPhoneNumber(phone);

      // Try the dedicated OTP API first (different base URL without /v2)
      const otpPayload = {
        expiry: 10, // 10 minutes
        length: 6, // 6-digit OTP
        medium: "sms",
        message: `Your ${hospitalName} verification code is %otp_code%. This code will expire in 10 minutes. Do not share this code with anyone.`,
        number: formattedPhone,
        sender_id: this.senderId,
        type: "numeric",
      };

      console.log(`[Arkesel] Trying dedicated OTP API for ${formattedPhone}`);

      // Try the OTP endpoint (may be at different URL)
      const otpEndpoints = [
        "https://sms.arkesel.com/api/otp/generate",  // Without /v2
        `${this.baseUrl}/otp/generate`,              // With /v2
      ];

      for (const endpoint of otpEndpoints) {
        try {
          console.log(`[Arkesel] Trying OTP endpoint: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "api-key": this.apiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(otpPayload),
          });

          // Check if response is JSON
          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            const textResponse = await response.text();
            console.log(`[Arkesel] Non-JSON response from ${endpoint}:`, textResponse.substring(0, 200));
            continue; // Try next endpoint
          }

          const responseData = await response.json();
          console.log("[Arkesel] OTP API response:", responseData);

          // Arkesel OTP API returns code "1100" for success
          if (response.ok && (responseData.code === "1100" || responseData.status === "success")) {
            console.log("[Arkesel] OTP sent successfully via dedicated OTP API");
            return {
              status: "success",
              message: "OTP sent successfully",
              data: responseData.data,
              generatedOtp: responseData.data?.otp,
            };
          }
        } catch (endpointError) {
          console.log(`[Arkesel] OTP endpoint ${endpoint} failed:`, endpointError);
          continue; // Try next endpoint
        }
      }

      // If dedicated OTP API fails, fall back to regular SMS
      console.log("[Arkesel] OTP API not available, falling back to regular SMS");
      return await this.sendOTPViaSMS(phone, otp, hospitalName);

    } catch (error) {
      console.error("[Arkesel] OTP sending error:", error);

      return {
        status: "error",
        message: error instanceof Error ? error.message : "Failed to send OTP",
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Send OTP SMS using regular SMS API (fallback method)
   * Use this if you want to manage OTP generation yourself
   */
  async sendOTPViaSMS(
    phone: string,
    otp: string,
    hospitalName: string = "AGAHF Hospital"
  ): Promise<ArkeselSMSResponse> {
    const message = `Your ${hospitalName} verification code is: ${otp}. This code will expire in 10 minutes. Do not share this code with anyone.`;

    return this.sendSMS({
      to: phone,
      message: message,
    });
  }

  /**
   * Send appointment confirmation SMS
   */
  async sendAppointmentConfirmation(
    phone: string,
    appointmentDetails: {
      date: string;
      time: string;
      department: string;
      hospitalName?: string;
    }
  ): Promise<ArkeselSMSResponse> {
    const {
      date,
      time,
      department,
      hospitalName = "AGAHF Hospital",
    } = appointmentDetails;

    const message = `Your appointment at ${hospitalName} is confirmed for ${date} at ${time} in ${department}. Please arrive 15 minutes early. Thank you.`;

    return this.sendSMS({
      to: phone,
      message: message,
    });
  }

  /**
   * Send appointment reminder SMS
   */
  async sendAppointmentReminder(
    phone: string,
    appointmentDetails: {
      date: string;
      time: string;
      department: string;
      hospitalName?: string;
    }
  ): Promise<ArkeselSMSResponse> {
    const {
      date,
      time,
      department,
      hospitalName = "AGAHF Hospital",
    } = appointmentDetails;

    const message = `Reminder: You have an appointment at ${hospitalName} tomorrow (${date}) at ${time} in ${department}. Please arrive 15 minutes early.`;

    return this.sendSMS({
      to: phone,
      message: message,
    });
  }

  /**
   * Test SMS connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.apiKey) {
        console.log("[Arkesel] API key not configured");
        return false;
      }

      // Check balance as a connectivity test (doesn't send SMS)
      const response = await fetch(`${this.baseUrl}/clients/balance-details`, {
        method: "GET",
        headers: {
          "api-key": this.apiKey,
        },
      });

      const data = await response.json();
      console.log("[Arkesel] Connection test - Balance:", data);

      return response.ok;
    } catch (error) {
      console.error("[Arkesel] Connection test failed:", error);
      return false;
    }
  }

  /**
   * Check if Arkesel is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

// Export singleton instance
export const arkeselSMS = new ArkeselSMSService();

// Export class for testing
export { ArkeselSMSService };

// Export types
export type { ArkeselSMSResponse, SendSMSParams };
