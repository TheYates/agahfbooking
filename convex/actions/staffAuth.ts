"use node";

/**
 * Staff Authentication Action
 * 
 * Handles password verification using bcrypt and creates Convex Auth session.
 * Actions can use Node.js libraries like bcrypt.
 */

import { v } from "convex/values";
import { action } from "../_generated/server";
import { ConvexError } from "convex/values";
import { Id } from "../_generated/dataModel";
import { FunctionReference } from "convex/server";

// Define the expected staff user type to avoid deep type instantiation
type StaffUser = {
  _id: Id<"users">;
  name: string;
  phone: string;
  role: "receptionist" | "admin";
  employee_id?: string;
  password_hash?: string;
  is_active: boolean;
  created_at: number;
  updated_at: number;
} | null;

// Reference to the internal query - typed to avoid circular reference issues
const findByUsernameInternalRef = "queries/staff:findByUsernameInternal" as unknown as FunctionReference<"query", "internal", { username: string }, StaffUser>;

export const authenticateStaff = action({
  args: {
    username: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { username, password }) => {
    // Import bcrypt dynamically (only available in actions)
    const bcrypt = await import("bcryptjs");
    
    // Find staff user by employee_id or name
    const staffUser = await ctx.runQuery(
      findByUsernameInternalRef,
      { username }
    );
    
    if (!staffUser || !staffUser.is_active) {
      throw new ConvexError({
        code: "INVALID_CREDENTIALS",
        message: "Invalid credentials",
      });
    }
    
    // Verify password using bcrypt
    if (!staffUser.password_hash) {
      throw new ConvexError({
        code: "INVALID_CREDENTIALS",
        message: "Invalid credentials",
      });
    }
    
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
