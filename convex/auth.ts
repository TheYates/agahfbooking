import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Convex Authentication Functions
 * Replaces Better Auth with Convex-native authentication
 */

// Generate a random 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP to client (phone or x_number)
 * This will integrate with Hubtel SMS service
 */
export const sendOTP = mutation({
  args: {
    identifier: v.string(), // phone or x_number
    type: v.union(v.literal("client"), v.literal("staff")),
  },
  handler: async (ctx, args) => {
    const { identifier, type } = args;

    // Check rate limiting
    const recentAttempts = await ctx.db
      .query("rate_limits")
      .withIndex("by_identifier_and_action", (q) =>
        q.eq("identifier", identifier).eq("action", "otp_request")
      )
      .first();

    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (recentAttempts) {
      if (recentAttempts.is_blocked && recentAttempts.blocked_until && recentAttempts.blocked_until > now) {
        throw new Error("Too many attempts. Please try again later.");
      }

      // Reset if window expired
      if (now - recentAttempts.window_start > fiveMinutes) {
        await ctx.db.patch(recentAttempts._id, {
          count: 1,
          window_start: now,
          last_attempt: now,
        });
      } else if (recentAttempts.count >= 5) {
        // Block for 15 minutes
        await ctx.db.patch(recentAttempts._id, {
          is_blocked: true,
          blocked_until: now + 15 * 60 * 1000,
        });
        throw new Error("Too many attempts. Please try again in 15 minutes.");
      } else {
        await ctx.db.patch(recentAttempts._id, {
          count: recentAttempts.count + 1,
          last_attempt: now,
        });
      }
    } else {
      // Create new rate limit record
      await ctx.db.insert("rate_limits", {
        identifier,
        action: "otp_request",
        count: 1,
        window_start: now,
        last_attempt: now,
        is_blocked: false,
      });
    }

    // Verify user/client exists
    if (type === "client") {
      const client = await ctx.db
        .query("clients")
        .withIndex("by_x_number", (q) => q.eq("x_number", identifier))
        .first();
      
      if (!client) {
        throw new Error("Client not found");
      }
    } else {
      const user = await ctx.db
        .query("users")
        .withIndex("by_phone", (q) => q.eq("phone", identifier))
        .first();
      
      if (!user) {
        throw new Error("Staff member not found");
      }
    }

    // Generate OTP
    const otpCode = generateOTP();
    const expiresAt = now + 10 * 60 * 1000; // 10 minutes

    // Save OTP to database
    await ctx.db.insert("otp_codes", {
      identifier,
      otp_code: otpCode,
      expires_at: expiresAt,
      is_used: false,
      created_at: now,
    });

    // TODO: Integrate with Hubtel SMS service to send OTP
    // For now, always return OTP (development mode)
    // In production, comment out the otp field and use SMS
    
    return {
      success: true,
      message: "OTP sent successfully",
      otp: otpCode, // Always return in dev (remove this in production)
    };
  },
});

/**
 * Verify OTP and create session
 */
export const verifyOTP = mutation({
  args: {
    identifier: v.string(),
    otp_code: v.string(),
    type: v.union(v.literal("client"), v.literal("staff")),
  },
  handler: async (ctx, args) => {
    const { identifier, otp_code, type } = args;

    // Find valid OTP
    const otpRecord = await ctx.db
      .query("otp_codes")
      .withIndex("by_identifier", (q) => q.eq("identifier", identifier))
      .order("desc")
      .first();

    if (!otpRecord) {
      throw new Error("Invalid OTP");
    }

    const now = Date.now();

    if (otpRecord.is_used) {
      throw new Error("OTP already used");
    }

    if (otpRecord.expires_at < now) {
      throw new Error("OTP expired");
    }

    if (otpRecord.otp_code !== otp_code) {
      throw new Error("Invalid OTP");
    }

    // Mark OTP as used
    await ctx.db.patch(otpRecord._id, { is_used: true });

    // Get user/client details
    if (type === "client") {
      const client = await ctx.db
        .query("clients")
        .withIndex("by_x_number", (q) => q.eq("x_number", identifier))
        .first();
      
      if (!client || !client.is_active) {
        throw new Error("Client not found or inactive");
      }

      console.log("Client found:", client);

      const userData = {
        id: client._id,
        name: client.name,
        phone: client.phone,
        x_number: client.x_number,
        category: client.category,
        role: "client" as const,
      };

      console.log("Returning user data:", userData);

      return {
        success: true,
        user: userData,
      };
    } else {
      const user = await ctx.db
        .query("users")
        .withIndex("by_phone", (q) => q.eq("phone", identifier))
        .first();
      
      if (!user || !user.is_active) {
        throw new Error("Staff member not found or inactive");
      }

      return {
        success: true,
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          employee_id: user.employee_id,
          role: user.role,
        },
      };
    }
  },
});

/**
 * Staff login with employee_id and password
 */
export const staffLogin = mutation({
  args: {
    employee_id: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const { employee_id, password } = args;

    const user = await ctx.db
      .query("users")
      .withIndex("by_employee_id", (q) => q.eq("employee_id", employee_id))
      .first();

    if (!user || !user.is_active) {
      throw new Error("Invalid credentials");
    }

    // TODO: Implement password verification with bcrypt
    // For now, basic comparison (should hash passwords in production)
    if (user.password_hash !== password) {
      throw new Error("Invalid credentials");
    }

    return {
      success: true,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        employee_id: user.employee_id,
        role: user.role,
      },
    };
  },
});

/**
 * Get current session (used for authentication checks)
 */
export const getCurrentUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    
    if (!user || !user.is_active) {
      return null;
    }

    return {
      id: user._id,
      name: user.name,
      phone: user.phone,
      employee_id: user.employee_id,
      role: user.role,
    };
  },
});

/**
 * Get current client
 */
export const getCurrentClient = query({
  args: {
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    
    if (!client || !client.is_active) {
      return null;
    }

    return {
      id: client._id,
      name: client.name,
      phone: client.phone,
      x_number: client.x_number,
      category: client.category,
    };
  },
});

/**
 * Logout (client-side will clear session)
 */
export const logout = mutation({
  args: {},
  handler: async (ctx, args) => {
    // With Convex, sessions are typically managed client-side
    // This is a placeholder for any server-side cleanup
    return { success: true };
  },
});
