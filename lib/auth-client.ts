"use client";

import { createAuthClient } from "better-auth/react";

const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export const useSession = authClient.useSession;
export const signIn = authClient.signIn;
export const signOut = authClient.signOut;
export const signUp = authClient.signUp;

export function useCurrentUser() {
  const session = useSession();
  return session.data?.user || null;
}

export const authActions = {
  async staffLogin(username: string, password: string) {
    const response = await fetch("/api/auth/staff-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }
    return response.json();
  },

  async sendOTP(xNumber: string) {
    const response = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ xNumber }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to send OTP");
    }
    return response.json();
  },

  async verifyOTP(xNumber: string, otp: string) {
    const response = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ xNumber, otp }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to verify OTP");
    }
    return response.json();
  },

  async clearSession() {
    const response = await fetch("/api/auth/clear-session", { method: "POST" });
    if (!response.ok) {
      throw new Error("Failed to clear session");
    }
    return response.json();
  },
};
