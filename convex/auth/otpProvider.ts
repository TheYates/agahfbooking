"use node";

/**
 * OTP Provider for Client Authentication
 * 
 * Handles OTP generation, SMS sending, and verification for client users.
 * Uses JWT-based OTP tokens and integrates with Hubtel SMS service.
 * Supports mock mode for development.
 */

import { v } from "convex/values";
import { mutation, action } from "../_generated/server";
import { api } from "../_generated/api";
import { ConvexError } from "convex/values";

/**
 * Generate and send OTP to client
 * This is an action because it needs to:
 * 1. Use Node.js libraries (jsonwebtoken)
 * 2. Make external API calls (Hubtel SMS)
 */
export const sendOTP = action({
  args: { xNumber: v.string() },
  handler: async (ctx, { xNumber }) => {
    // Import JWT library (only available in actions)
    const jwt = await import("jsonwebtoken");
    const crypto = await import("crypto");
    
    // Find client by X-number
    const client = await ctx.runQuery(api.queries.clients.getByXNumber, {
      xNumber,
    });
    
    if (!client) {
      throw new ConvexError({
        code: "CLIENT_NOT_FOUND",
        message: "Client not found",
      });
    }
    
    if (!client.is_active) {
      throw new ConvexError({
        code: "CLIENT_INACTIVE",
        message: "Client account is inactive",
      });
    }
    
    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Create JWT token with OTP
    const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key";
    const OTP_EXPIRY_MINUTES = 10;
    const now = Date.now();
    const expiresAt = now + OTP_EXPIRY_MINUTES * 60 * 1000;
    
    const tokenData = {
      xNumber,
      otp,
      expiresAt,
      nonce: crypto.randomUUID(),
      mode: process.env.OTP_MODE === "hubtel" ? "hubtel" : "mock",
      generatedAt: now,
    };
    
    const token = jwt.sign(tokenData, JWT_SECRET, {
      expiresIn: `${OTP_EXPIRY_MINUTES}m`,
      issuer: "agahf-booking-system",
      subject: "otp-verification",
    });
    
    // Send OTP via SMS
    const smsResult = await ctx.runAction(api.actions.sms.sendOTP, {
      phone: client.phone,
      otp,
      hospitalName: "AGAHF Hospital",
    });
    
    console.log(`🔐 OTP Generated: ${otp} for ${xNumber} (${tokenData.mode} mode)`);
    console.log(`⏰ Expires at: ${new Date(expiresAt).toISOString()}`);
    
    return {
      success: true,
      maskedPhone: client.phone.replace(/(\d{3})\d{4}(\d{3})/, "$1****$2"),
      token,
      expiresAt,
      mode: tokenData.mode,
      smsStatus: smsResult.success ? "sent" : "failed",
    };
  },
});

/**
 * Verify OTP and create client session
 * This is an action because it needs to verify JWT tokens
 */
export const verifyOTP = action({
  args: { 
    token: v.string(), 
    otp: v.string() 
  },
  handler: async (ctx, { token, otp }) => {
    // Import JWT library
    const jwt = await import("jsonwebtoken");
    
    const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key";
    
    try {
      // Verify and decode JWT
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: "agahf-booking-system",
        subject: "otp-verification",
      }) as any;
      
      // Check if OTP matches
      if (decoded.otp !== otp) {
        throw new ConvexError({
          code: "INVALID_OTP",
          message: "Invalid OTP code",
        });
      }
      
      // Check if token is expired (double check)
      if (decoded.expiresAt < Date.now()) {
        throw new ConvexError({
          code: "OTP_EXPIRED",
          message: "OTP has expired",
        });
      }
      
      // Find client
      const client = await ctx.runQuery(api.queries.clients.getByXNumber, {
        xNumber: decoded.xNumber,
      });
      
      if (!client) {
        throw new ConvexError({
          code: "CLIENT_NOT_FOUND",
          message: "Client not found",
        });
      }
      
      if (!client.is_active) {
        throw new ConvexError({
          code: "CLIENT_INACTIVE",
          message: "Client account is inactive",
        });
      }
      
      console.log(`✅ OTP Verified: ${otp} for ${decoded.xNumber} (${decoded.mode} mode)`);
      
      // Return client data for session creation
      // Note: Session creation will be handled by the frontend using Convex Auth
      return {
        success: true,
        client: {
          id: client._id,
          xNumber: client.x_number,
          name: client.name,
          phone: client.phone,
          category: client.category,
        },
      };
      
    } catch (error: any) {
      console.error("OTP verification error:", error);
      
      if (error.name === "TokenExpiredError") {
        throw new ConvexError({
          code: "OTP_EXPIRED",
          message: "OTP has expired",
        });
      }
      
      if (error.name === "JsonWebTokenError") {
        throw new ConvexError({
          code: "INVALID_TOKEN",
          message: "Invalid OTP token",
        });
      }
      
      // Re-throw ConvexError as-is
      if (error.code) {
        throw error;
      }
      
      throw new ConvexError({
        code: "VERIFICATION_FAILED",
        message: "OTP verification failed",
      });
    }
  },
});
