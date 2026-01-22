/**
 * Convex Auth Configuration
 * 
 * This module configures Convex Auth with Password provider for staff users
 * and custom OTP provider for client users.
 */

import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { DataModel } from "./_generated/dataModel";

// Configure Convex Auth with Password provider
export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    // Password provider for staff users (receptionists and admins)
    Password({
      profile(params) {
        return {
          email: params.email as string,
          name: params.name as string,
        };
      },
    }),
  ],
  
  // Session configuration
  session: {
    // Session duration: 24 hours (as per requirements)
    totalDurationMs: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  },
});
