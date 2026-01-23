/**
 * Staff Authentication Action
 * 
 * Handles password verification using bcrypt and creates Convex Auth session.
 * Actions can use Node.js libraries like bcrypt.
 */

import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { ConvexError } from "convex/values";

export const authenticateStaff = action({
  args: {
    username: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { username, password }) => {
    // Import bcrypt dynamically (only available in actions)
    const bcrypt = await import("bcryptjs");
    
    // Find staff user by employee_id or name
    const staffUser = await ctx.runQuery(api.queries.staff.findByUsername, {
      username,
    });
    
    if (!staffUser || !staffUser.is_active) {
      throw new ConvexError({
        code: "INVALID_CREDENTIALS",
        message: "Invalid credentials",
      });
    }
    
    // Verify password using bcrypt
    const isValid = await bcrypt.compare(password, staffUser.password_hash);
    
    if (!isValid) {
      throw new ConvexError({
        code: "INVALID_CREDENTIALS",
        message: "Invalid credentials",
      });
    }
    
    // Create session using Convex Auth
    // Note: Session creation will be handled by the frontend using signIn
    // This action just validates credentials
    
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
