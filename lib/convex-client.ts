import { ConvexReactClient } from "convex/react";

/**
 * Convex Client Configuration
 * Replaces PostgreSQL connection pool and query client
 */

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

if (!convexUrl) {
  console.warn(
    "⚠️ NEXT_PUBLIC_CONVEX_URL not set. Please run `npx convex dev` to get your URL."
  );
}

export const convex = new ConvexReactClient(convexUrl || "");

export default convex;
