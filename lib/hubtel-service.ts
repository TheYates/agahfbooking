// Initialize Hubtel client
const clientId = process.env.HUBTEL_CLIENT_ID;
const clientSecret = process.env.HUBTEL_CLIENT_SECRET;
const senderId = process.env.HUBTEL_SENDER_ID || "AGAHF";

// Check if credentials are properly configured (not placeholder values)
const isValidClientId = clientId && clientId !== "your_hubtel_client_id_here";
const isValidClientSecret =
  clientSecret && clientSecret !== "your_hubtel_client_secret_here";

if (!isValidClientId || !isValidClientSecret) {
  console.warn(
    "Hubtel credentials not configured properly. SMS functionality will be disabled."
  );
}

export class HubtelService {
  /**
   * Send SMS message using Hubtel
   * @param to - Recipient phone number (must include country code, e.g., +233240298713)
   * @param message - Message content
   * @returns Promise<boolean> - Success status
   */
  static async sendSMS(to: string, message: string): Promise<boolean> {
    if (!isValidClientId || !isValidClientSecret) {
      console.error("Hubtel not configured. Cannot send SMS.");
      return false;
    }

    try {
      // Ensure phone number has country code
      const formattedTo = to.startsWith("+") ? to : `+${to}`;

      // Create Basic Auth header
      const auth = Buffer.from(`${clientId}:${clientSecret}`).toString(
        "base64"
      );

      const response = await fetch("https://smsc.hubtel.com/v1/messages/send", {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          From: senderId,
          To: formattedTo,
          Content: message,
        }),
      });

      const result = await response.json();

      if (response.ok && result.status === 0) {
        console.log(`SMS sent successfully. MessageId: ${result.messageId}`);
        return true;
      } else {
        console.error("Failed to send SMS:", result);
        return false;
      }
    } catch (error) {
      console.error("Failed to send SMS:", error);
      return false;
    }
  }

  /**
   * Send OTP via SMS
   * @param phoneNumber - Recipient phone number
   * @param otp - OTP code
   * @param hospitalName - Hospital name for branding
   * @returns Promise<boolean> - Success status
   */
  static async sendOTP(
    phoneNumber: string,
    otp: string,
    hospitalName: string = "AGAHF Hospital"
  ): Promise<boolean> {
    const message = `Your ${hospitalName} appointment system OTP is: ${otp}. 
    This code expires in 10 minutes. 
    Do not share this code with anyone.`;

    return await this.sendSMS(phoneNumber, message);
  }

  /**
   * Generate a random 6-digit OTP
   * @returns string - 6-digit OTP
   */
  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Check if Hubtel is properly configured
   * @returns boolean - Configuration status
   */
  static isConfigured(): boolean {
    return !!(isValidClientId && isValidClientSecret);
  }
}
