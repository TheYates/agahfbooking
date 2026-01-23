/**
 * Staff User Queries
 * 
 * Query functions for staff user data retrieval.
 */

import { v } from "convex/values";
import { query } from "../_generated/server";

// Find staff user by username (employee_id or name)
export const findByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    return await ctx.db
      .query("users")
      .filter((q) =>
        q.or(
          q.eq(q.field("employee_id"), username),
          q.eq(q.field("name"), username)
        )
      )
      .first();
  },
});

// Get staff user by ID
export const getById = query({
  args: { staffId: v.id("users") },
  handler: async (ctx, { staffId }) => {
    return await ctx.db.get(staffId);
  },
});

// Get all active staff users
export const getAllActive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();
  },
});
