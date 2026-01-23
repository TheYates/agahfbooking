"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";

/**
 * Custom hook for Convex authentication
 * Replaces Better Auth hooks
 */

interface User {
  id: Id<"users"> | Id<"clients">;
  name: string;
  phone: string;
  role: string;
  x_number?: string;
  xNumber?: string; // Add both formats for compatibility
  category?: string;
  employee_id?: string;
  convexId?: Id<"users"> | Id<"clients">; // Add convexId for dashboard queries
}

export function useConvexAuth() {
  const [user, setUser] = useState<User | null>(() => {
    // Check localStorage for existing session
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("convex_user");
      return savedUser ? JSON.parse(savedUser) : null;
    }
    return null;
  });

  const sendOTP = useMutation(api.auth.sendOTP);
  const verifyOTP = useMutation(api.auth.verifyOTP);
  const staffLogin = useMutation(api.auth.staffLogin);

  const handleSendOTP = async (identifier: string, type: "client" | "staff") => {
    try {
      const result = await sendOTP({ identifier, type });
      return result;
    } catch (error: any) {
      throw new Error(error.message || "Failed to send OTP");
    }
  };

  const handleVerifyOTP = async (
    identifier: string,
    otp_code: string,
    type: "client" | "staff"
  ) => {
    try {
      const result = await verifyOTP({ identifier, otp_code, type });
      if (result.success && result.user) {
        setUser(result.user as User);
        localStorage.setItem("convex_user", JSON.stringify(result.user));
      }
      return result;
    } catch (error: any) {
      throw new Error(error.message || "Failed to verify OTP");
    }
  };

  const handleStaffLogin = async (employee_id: string, password: string) => {
    try {
      const result = await staffLogin({ employee_id, password });
      if (result.success && result.user) {
        setUser(result.user as User);
        localStorage.setItem("convex_user", JSON.stringify(result.user));
      }
      return result;
    } catch (error: any) {
      throw new Error(error.message || "Invalid credentials");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("convex_user");
  };

  return {
    user,
    isAuthenticated: !!user,
    sendOTP: handleSendOTP,
    verifyOTP: handleVerifyOTP,
    staffLogin: handleStaffLogin,
    logout,
  };
}
