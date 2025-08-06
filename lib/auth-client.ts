"use client";

import { createAuthClient } from "better-auth/react";

// Create BetterAuth client for React components
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

// Export hooks for use in components
export const {
  useSession,
  signIn,
  signOut,
  signUp,
} = authClient;

// Custom hook for current user (backward compatibility)
export function useCurrentUser() {
  const session = useSession();
  return session.data?.user || null;
}

// Helper functions for authentication actions
export const authActions = {
  // Staff login using our custom endpoint
  async staffLogin(username: string, password: string) {
    const response = await fetch("/api/auth/staff-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }

    return response.json();
  },

  // Send OTP using our custom endpoint
  async sendOTP(xNumber: string) {
    const response = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ xNumber }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to send OTP");
    }

    return response.json();
  },

  // Verify OTP using our custom endpoint
  async verifyOTP(xNumber: string, otp: string) {
    const response = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ xNumber, otp }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to verify OTP");
    }

    return response.json();
  },

  // Clear session
  async clearSession() {
    const response = await fetch("/api/auth/clear-session", {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Failed to clear session");
    }

    return response.json();
  },
};
