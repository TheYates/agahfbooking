import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Admin utility functions for testing/debugging
 */

// Clear rate limits for an identifier
export const clearRateLimit = mutation({
  args: {
    identifier: v.string(),
  },
  handler: async (ctx, args) => {
    const rateLimits = await ctx.db
      .query("rate_limits")
      .withIndex("by_identifier", (q) => q.eq("identifier", args.identifier))
      .collect();

    for (const limit of rateLimits) {
      await ctx.db.delete(limit._id);
    }

    return { success: true, deleted: rateLimits.length };
  },
});

// Clear all rate limits
export const clearAllRateLimits = mutation({
  args: {},
  handler: async (ctx, args) => {
    const rateLimits = await ctx.db.query("rate_limits").collect();

    for (const limit of rateLimits) {
      await ctx.db.delete(limit._id);
    }

    return { success: true, deleted: rateLimits.length };
  },
});

// Get all rate limits
export const getRateLimits = query({
  args: {},
  handler: async (ctx, args) => {
    return await ctx.db.query("rate_limits").collect();
  },
});
