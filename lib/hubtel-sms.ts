/**
 * Hubtel SMS Service for sending OTP and other messages
 */

interface HubtelSMSResponse {
  status: string;
  message: string;
  data?: any;
  errors?: string[];
}

interface SendSMSParams {
  to: string;
  message: string;
  from?: string;
}

class HubtelSMSService {
  private clientId: string;
  private clientSecret: string;
  private senderId: string;
  private baseUrl: string = "https://smsc.hubtel.com/v1/messages/send";

  constructor() {
    this.clientId = process.env.HUBTEL_CLIENT_ID || "";
    this.clientSecret = process.env.HUBTEL_CLIENT_SECRET || "";
    this.senderId = process.env.HUBTEL_SENDER_ID || "AGAHF";

    if (!this.clientId || !this.clientSecret) {
      console.warn("Hubtel credentials not configured. SMS sending will be disabled.");
    }
  }

  /**
   * Get Basic Auth header for Hubtel API
   */
  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    return `Basic ${credentials}`;
  }

  /**
   * Format phone number for Ghana (+233 format)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove any spaces, dashes, or other characters
    let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // Handle different Ghana phone number formats
    if (cleanPhone.startsWith('0')) {
      // Convert 0XX XXX XXXX to 233XX XXX XXXX
      cleanPhone = '233' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('+233')) {
      // Remove the + sign
      cleanPhone = cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('233')) {
      // Already in correct format
      cleanPhone = cleanPhone;
    } else {
      // Assume it's a local number and add 233
      cleanPhone = '233' + cleanPhone;
    }

    return cleanPhone;
  }

  /**
   * Send SMS via Hubtel API
   */
  async sendSMS({ to, message, from }: SendSMSParams): Promise<HubtelSMSResponse> {
    try {
      if (!this.clientId || !this.clientSecret) {
        throw new Error("Hubtel credentials not configured");
      }

      const formattedPhone = this.formatPhoneNumber(to);
      const sender = from || this.senderId;

      const payload = {
        From: sender,
        To: formattedPhone,
        Content: message,
        Type: 0, // Text message
        RegisteredDelivery: true
      };

      console.log(`Sending SMS to ${formattedPhone} from ${sender}`);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('Hubtel SMS API error:', responseData);
        throw new Error(`Hubtel API error: ${responseData.message || 'Unknown error'}`);
      }

      console.log('SMS sent successfully:', responseData);

      return {
        status: 'success',
        message: 'SMS sent successfully',
        data: responseData
      };

    } catch (error) {
      console.error('SMS sending error:', error);
      
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to send SMS',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Send OTP SMS
   */
  async sendOTP(phone: string, otp: string, hospitalName: string = "AGAHF Hospital"): Promise<HubtelSMSResponse> {
    const message = `Your ${hospitalName} verification code is: ${otp}. This code will expire in 10 minutes. Do not share this code with anyone.`;
    
    return this.sendSMS({
      to: phone,
      message: message
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
  ): Promise<HubtelSMSResponse> {
    const { date, time, department, hospitalName = "AGAHF Hospital" } = appointmentDetails;
    
    const message = `Your appointment at ${hospitalName} is confirmed for ${date} at ${time} in ${department}. Please arrive 15 minutes early. Thank you.`;
    
    return this.sendSMS({
      to: phone,
      message: message
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
  ): Promise<HubtelSMSResponse> {
    const { date, time, department, hospitalName = "AGAHF Hospital" } = appointmentDetails;
    
    const message = `Reminder: You have an appointment at ${hospitalName} tomorrow (${date}) at ${time} in ${department}. Please arrive 15 minutes early.`;
    
    return this.sendSMS({
      to: phone,
      message: message
    });
  }

  /**
   * Test SMS connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.clientId || !this.clientSecret) {
        console.log("Hubtel credentials not configured");
        return false;
      }

      // Test with a simple message to a test number
      const testResult = await this.sendSMS({
        to: "233200000000", // Test number
        message: "Test message from AGAHF Hospital booking system"
      });

      return testResult.status === 'success';
    } catch (error) {
      console.error('Hubtel connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const hubtelSMS = new HubtelSMSService();

// Export class for testing
export { HubtelSMSService };

// Export types
export type { HubtelSMSResponse, SendSMSParams };
