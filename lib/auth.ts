import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { createHash, randomUUID } from "node:crypto";
import { query } from "./db";
import bcrypt from "bcryptjs";
import { ClientService, UserService } from "./db-services";
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
    // Use Supabase instead of pg pool
    const supabase = await createAdminSupabaseClient();
    
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .single();

    if (error || !user) {
      throw new Error("Invalid username or password");
    }

    // Check if user is active and has correct role
    if (!user.is_active) {
      throw new Error("User account is inactive");
    }

    if (user.role !== "receptionist" && user.role !== "admin" && user.role !== "reviewer") {
      throw new Error("Invalid username or password");
    }

    // Verify password using bcrypt
    if (!user.password_hash) {
      throw new Error("Password not set. Please contact administrator.");
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      throw new Error("Invalid username or password");
    }

    // Update last login timestamp using Supabase
    await supabase
      .from("users")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", user.id);

    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      username: user.username || "",
      employee_id: user.username || "", // For backward compatibility
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

    // Find client by X-number
    const client = await ClientService.findByXNumber(xNumber);

    if (!client) {
      throw new Error("Client not found");
    }

    if (!client.is_active) {
      throw new Error("Client account is inactive");
    }

    return {
      id: client.id,
      xNumber: client.x_number,
      name: client.name,
      phone: client.phone,
      category: client.category,
      role: "client" as const,
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
