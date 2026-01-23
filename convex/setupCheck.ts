/**
 * Setup verification script for Convex configuration
 * Run this to verify that the Convex project is properly set up
 */

import { query } from "./_generated/server";

export const healthCheck = query({
  args: {},
  handler: async () => {
    return {
      status: "ok",
      message: "Convex backend is properly configured",
      timestamp: new Date().toISOString(),
    };
  },
});
