/**
 * Staff Login Mutation
 * 
 * Handles authentication for hospital staff (receptionists and admins)
 * using username/password credentials with bcrypt password verification.
 * 
 * Note: This is a mutation (not action) so it can't use Node.js runtime.
 * Password verification is done in the API route before calling this.
 */

import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { ConvexError } from "convex/values";

// Note: bcrypt will be used via Node.js action, not directly in mutation
// For now, we'll create a helper that can be called from an action

export const staffLogin = mutation({
  args: {
    username: v.string(),
    passwordHash: v.string(), // Pre-hashed password from action
  },
  handler: async (ctx, { username, passwordHash }) => {
    // Find staff user by employee_id or name
    const staffUser = await ctx.db
      .query("users")
      .filter((q) =>
        q.or(
          q.eq(q.field("employee_id"), username),
          q.eq(q.field("name"), username)
        )
      )
      .first();
    
    if (!staffUser || !staffUser.is_active) {
      throw new ConvexError({
        code: "INVALID_CREDENTIALS",
        message: "Invalid credentials",
      });
    }
    
    // Verify password hash matches
    if (staffUser.password_hash !== passwordHash) {
      throw new ConvexError({
        code: "INVALID_CREDENTIALS",
        message: "Invalid credentials",
      });
    }
    
    // Return staff user data for session creation
    return {
      success: true,
      user: {
        id: staffUser._id,
        name: staffUser.name,
        role: staffUser.role,
        employeeId: staffUser.employee_id,
        phone: staffUser.phone,
      },
    };
  },
});
