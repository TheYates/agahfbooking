// Re-export User type for backward compatibility
export type { User } from "./types";

// Re-export server functions
export { getCurrentUser, requireAuth, requireRole } from "./auth-server";
