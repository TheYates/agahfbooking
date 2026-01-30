import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { createHash, randomUUID } from "node:crypto";
import { query } from "./db";
import bcrypt from "bcryptjs";
import { ClientService } from "./db-services";
import { otpConfig } from "./otp-config-service";
import { jwtOTPService } from "./jwt-otp-service";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

// Create PostgreSQL connection pool for BetterAuth
const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

// BetterAuth secret
//
// BetterAuth logs an error if you do not provide a secret and it falls back to
// its internal default. To avoid noisy build/prerender logs (and to ensure
// sessions are signed with a consistent secret), we explicitly set one.
//
// - In production, set BETTER_AUTH_SECRET.
// - In dev/build, we derive a deterministic fallback from DATABASE_URL.
const BETTER_AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET ||
  createHash("sha256")
    .update(process.env.DATABASE_URL || "local")
    .digest("hex");

export const auth = betterAuth({
  secret: BETTER_AUTH_SECRET,
  database: pool,
  emailAndPassword: {
    enabled: false, // We'll use custom providers instead
  },
  session: {
    expiresIn: 60 * 60 * 24, // 24 hours
    updateAge: 60 * 60, // 1 hour
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  advanced: {
    generateId: () => randomUUID(),
  },
});

// Custom authentication functions
export async function staffLogin(username: string, password: string) {
  if (!username || !password) {
    throw new Error("Username and password are required");
  }

  try {
    // Use Convex instead of PostgreSQL
    const { ConvexHttpClient } = await import("convex/browser");
    const { api } = await import("@/convex/_generated/api");
    
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      throw new Error("Convex URL not configured");
    }

    const convexClient = new ConvexHttpClient(convexUrl);

    // Find user by employee_id in Convex
    const user = await convexClient.query(api.queries.getUserByEmployeeId, {
      employee_id: username,
    });

    if (!user) {
      throw new Error("Invalid username or password");
    }

    // Check if user is active and has correct role
    if (!user.is_active) {
      throw new Error("User account is inactive");
    }

    if (user.role !== "receptionist" && user.role !== "admin") {
      throw new Error("Invalid username or password");
    }

    // Check if user has a password hash
    if (!user.password_hash) {
      throw new Error(
        "User account not properly configured. Please contact administrator."
      );
    }

    // Verify password
    console.log("🔍 Debug - Comparing passwords:");
    console.log("  Input password:", password);
    console.log("  Stored hash:", user.password_hash?.substring(0, 20) + "...");
    console.log("  Hash starts with $2a$ (bcrypt):", user.password_hash?.startsWith("$2a$") || user.password_hash?.startsWith("$2b$"));
    
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    console.log("  Password valid:", isValidPassword);
    
    if (!isValidPassword) {
      throw new Error("Invalid username or password");
    }

    // Return user data with Convex ID
    return {
      id: parseInt(user._id, 36) || 0, // Convert Convex ID to number for compatibility
      name: user.name,
      phone: user.phone,
      role: user.role,
      employee_id: user.employee_id || "",
      convexId: user._id,
      loginTime: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Staff login error:", error);
    throw error;
  }
}

export async function sendOTP(xNumber: string) {
  if (!xNumber) {
    throw new Error("X-number is required");
  }

  try {
    // Find client by X-number
    const client = await ClientService.findByXNumber(xNumber);
    if (!client) {
      throw new Error("Client not found");
    }

    // Get current OTP mode and generate JWT-based OTP
    const currentMode = await otpConfig.getCurrentMode();
    const otpResult = jwtOTPService.generateOTP(xNumber, currentMode);

    // Send OTP via configured service (Hubtel or Mock)
    try {
      const smsResult = await otpConfig.sendOTP(
        client.phone,
        otpResult.otp,
        "AGAHF Hospital"
      );

      if (smsResult.status === "success") {
        // Use already-fetched currentMode instead of querying again
        console.log(
          `✅ OTP sent successfully to ${
            client.phone
          } for ${xNumber} via ${currentMode.toUpperCase()}`
        );
      } else {
        console.warn(
          `⚠️ SMS sending failed for ${xNumber}: ${smsResult.message}`
        );
        // Continue anyway - OTP is still valid for manual entry
      }
    } catch (smsError) {
      console.error(`❌ SMS sending error for ${xNumber}:`, smsError);
      // Continue anyway - OTP is still valid for manual entry
    }

    // For development: Log OTP to console as backup
    if (process.env.NODE_ENV === "development") {
      console.log(
        `🔐 DEV MODE: OTP ${otpResult.otp} for ${xNumber} (${client.phone})`
      );
    }

    const maskedPhone = client.phone.replace(/(\d{3})\d{4}(\d{3})/, "$1****$2");

    return {
      success: true,
      message: "OTP sent successfully",
      maskedPhone,
      token: otpResult.token, // JWT token for verification
      expiresAt: otpResult.expiresAt,
      expiresIn: 10, // minutes
      // Include OTP in response for mock mode (development/testing)
      ...(currentMode === "mock" && { otp: otpResult.otp }),
    };
  } catch (error) {
    console.error("Send OTP error:", error);
    throw error;
  }
}

export async function verifyOTP(token: string, otp: string) {
  try {
    // Verify OTP using JWT
    const verificationResult = jwtOTPService.verifyOTP(token, otp);
    if (!verificationResult.isValid) {
      throw new Error(verificationResult.error || "Invalid or expired OTP");
    }

    const xNumber = verificationResult.xNumber!;

    // Use Convex instead of PostgreSQL
    const { ConvexHttpClient } = await import("convex/browser");
    const { api } = await import("@/convex/_generated/api");
    
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      throw new Error("Convex URL not configured");
    }

    const convexClient = new ConvexHttpClient(convexUrl);

    console.log("🔍 Looking up client in Convex by X-number:", xNumber);

    // Find client by X-number in Convex
    const client = await convexClient.query(api.queries.getClientByXNumber, {
      x_number: xNumber,
    });

    console.log("📊 Convex client lookup result:", {
      found: !!client,
      clientId: client?._id,
      clientName: client?.name,
      xNumber: xNumber,
    });

    if (!client) {
      console.error("❌ Client not found in Convex for X-number:", xNumber);
      throw new Error("Client not found");
    }

    // Check if client is active
    if (!client.is_active) {
      console.error("❌ Client account is inactive:", xNumber);
      throw new Error("Client account is inactive");
    }

    console.log("✅ Returning user data with convexId:", client._id);

    // Return session data with Convex ID
    return {
      id: parseInt(client._id, 36) || 0, // Convert Convex ID to number for compatibility
      xNumber: client.x_number,
      name: client.name,
      phone: client.phone,
      category: client.category,
      role: "client" as const,
      convexId: client._id,
      loginTime: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Verify OTP error:", error);
    throw error;
  }
}

// Re-export User type for backward compatibility
export type { User } from "./types";

// Re-export server functions for backward compatibility
export {
  getCurrentUser,
  requireAuth,
  requireAdminAuth,
  requireStaffAuth,
  requireClientAuth,
} from "./auth-server";

export type Session = typeof auth.$Infer.Session;
