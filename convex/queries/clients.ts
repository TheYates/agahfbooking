/**
 * Client Queries
 * 
 * Query functions for client data retrieval.
 */

import { v } from "convex/values";
import { query, internalQuery } from "../_generated/server";

// Get client by X-number - public query
export const getByXNumber = query({
  args: { xNumber: v.string() },
  handler: async (ctx, { xNumber }) => {
    return await ctx.db
      .query("clients")
      .withIndex("by_x_number", (q) => q.eq("x_number", xNumber))
      .first();
  },
});

// Get client by X-number - internal query for use by actions
export const getByXNumberInternal = internalQuery({
  args: { xNumber: v.string() },
  handler: async (ctx, { xNumber }) => {
    return await ctx.db
      .query("clients")
      .withIndex("by_x_number", (q) => q.eq("x_number", xNumber))
      .first();
  },
});

// Get client by ID
export const getById = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, { clientId }) => {
    return await ctx.db.get(clientId);
  },
});

// Search clients by X-number, name, or phone
export const search = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, { searchTerm }) => {
    const clients = await ctx.db
      .query("clients")
      .filter((q) =>
        q.and(
          q.eq(q.field("is_active"), true),
          q.or(
            q.eq(q.field("x_number"), searchTerm),
            q.eq(q.field("name"), searchTerm),
            q.eq(q.field("phone"), searchTerm)
          )
        )
      )
      .collect();
    
    return clients;
  },
});

// Get all active clients
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("clients")
      .filter((q) => q.eq(q.field("is_active"), true))
      .order("asc")
      .collect();
  },
});
