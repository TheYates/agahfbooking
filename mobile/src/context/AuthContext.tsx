import React, { createContext, useContext, useState, useEffect } from "react";
import { Session, SessionUser } from "../types";
import {
  sendOTP,
  verifyOTP,
  staffLogin,
  logout,
  getSession,
} from "../utils/auth";
import { SecureStorage } from "../utils/secureStorage";

interface AuthContextType {
  user: SessionUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sendOTP: (xNumber: string) => Promise<void>;
  verifyOTP: (xNumber: string, otp: string) => Promise<void>;
  staffLogin: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const session = await getSession();
      if (session?.user) {
        setUser(session.user);
      }
    } catch (error) {
      console.error("Session check failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = async (xNumber: string) => {
    await sendOTP(xNumber);
  };

  const handleVerifyOTP = async (xNumber: string, otp: string) => {
    const session = await verifyOTP(xNumber, otp);
    setUser(session.user);
  };

  const handleStaffLogin = async (username: string, password: string) => {
    const session = await staffLogin(username, password);
    setUser(session.user);
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        sendOTP: handleSendOTP,
        verifyOTP: handleVerifyOTP,
        staffLogin: handleStaffLogin,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
