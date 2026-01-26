"use node";

/**
 * SMS Service Actions
 * 
 * Handles SMS sending via Hubtel or mock service.
 * Actions can make external API calls.
 */

import { v } from "convex/values";
import { action, internalAction } from "../_generated/server";

/**
 * Send OTP via SMS
 * Supports both Hubtel (production) and mock mode (development)
 */
export const sendOTP = action({
  args: {
    phone: v.string(),
    otp: v.string(),
    hospitalName: v.string(),
  },
  handler: async (ctx, { phone, otp, hospitalName }) => {
    const mode = process.env.OTP_MODE || "mock";
    
    if (mode === "hubtel") {
      return await sendViaHubtel(phone, otp, hospitalName);
    } else {
      return await sendViaMock(phone, otp, hospitalName);
    }
  },
});

// Internal action for sending OTP - used by other actions to avoid circular type references
export const sendOTPInternal = internalAction({
  args: {
    phone: v.string(),
    otp: v.string(),
    hospitalName: v.string(),
  },
  handler: async (ctx, { phone, otp, hospitalName }) => {
    const mode = process.env.OTP_MODE || "mock";
    
    if (mode === "hubtel") {
      return await sendViaHubtel(phone, otp, hospitalName);
    } else {
      return await sendViaMock(phone, otp, hospitalName);
    }
  },
});

/**
 * Send SMS via Hubtel
 */
async function sendViaHubtel(
  phone: string,
  otp: string,
  hospitalName: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const clientId = process.env.HUBTEL_CLIENT_ID;
  const clientSecret = process.env.HUBTEL_CLIENT_SECRET;
  const senderId = process.env.HUBTEL_SENDER_ID || "AGAHF";
  
  if (!clientId || !clientSecret) {
    console.warn("Hubtel not configured. Falling back to mock mode.");
    return await sendViaMock(phone, otp, hospitalName);
  }
  
  try {
    const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    
    const message = `Your ${hospitalName} appointment system OTP is: ${otp}. This code expires in 10 minutes. Do not share this code with anyone.`;
    
    const response = await fetch("https://smsc.hubtel.com/v1/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        From: senderId,
        To: formattedPhone,
        Content: message,
      }),
    });
    
    const result = await response.json();
    
    if (response.ok && result.status === 0) {
      console.log(`📱 SMS sent via Hubtel. MessageId: ${result.messageId}`);
      return { success: true, messageId: result.messageId };
    } else {
      console.error("Hubtel SMS failed:", result);
      return { success: false, error: result.message };
    }
  } catch (error: any) {
    console.error("Hubtel SMS error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send SMS via mock service (logs to console)
 */
async function sendViaMock(
  phone: string,
  otp: string,
  hospitalName: string
): Promise<{ success: boolean; messageId?: string }> {
  const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;
  const message = `[MOCK] Your ${hospitalName} verification code is: ${otp}. This code will expire in 10 minutes. Do not share this code with anyone.`;
  
  console.log('\n🔧 MOCK SMS SERVICE - SMS "SENT"');
  console.log("=====================================");
  console.log(`📱 To: ${formattedPhone}`);
  console.log(`👤 From: AGAHF-MOCK`);
  console.log(`💬 Message: ${message}`);
  console.log("=====================================");
  console.log(`🔐 MOCK OTP: ${otp}`);
  console.log(`⏰ Expires in 10 minutes`);
  console.log(`🧪 For testing: Use OTP "${otp}" to verify\n`);
  
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 50));
  
  return {
    success: true,
    messageId: `mock_${Date.now()}`,
  };
}

/**
 * Send generic SMS
 */
export const sendSMS = action({
  args: {
    to: v.string(),
    message: v.string(),
  },
  handler: async (ctx, { to, message }) => {
    const mode = process.env.OTP_MODE || "mock";
    
    if (mode === "hubtel") {
      const clientId = process.env.HUBTEL_CLIENT_ID;
      const clientSecret = process.env.HUBTEL_CLIENT_SECRET;
      const senderId = process.env.HUBTEL_SENDER_ID || "AGAHF";
      
      if (!clientId || !clientSecret) {
        console.warn("Hubtel not configured");
        return { success: false, error: "SMS service not configured" };
      }
      
      try {
        const formattedTo = to.startsWith("+") ? to : `+${to}`;
        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
        
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
          return { success: true, messageId: result.messageId };
        } else {
          return { success: false, error: result.message };
        }
      } catch (error: any) {
        console.error("SMS sending failed:", error);
        return { success: false, error: "Failed to send SMS" };
      }
    } else {
      // Mock mode
      console.log('\n🔧 MOCK SMS SERVICE');
      console.log(`📱 To: ${to}`);
      console.log(`💬 Message: ${message}\n`);
      
      return {
        success: true,
        messageId: `mock_${Date.now()}`,
      };
    }
  },
});
