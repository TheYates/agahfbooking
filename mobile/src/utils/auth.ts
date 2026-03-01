import { api } from "./api";
import { SecureStorage } from "./secureStorage";
import { Session, SessionUser } from "../types";

/**
 * Send OTP to client
 */
export async function sendOTP(xNumber: string): Promise<{ message: string; otp?: string }> {
  return api.post("/api/auth/send-otp", { xNumber });
}

/**
 * Verify OTP and login
 */
export async function verifyOTP(
  xNumber: string,
  otp: string
): Promise<Session> {
  const response = await api.post<{
    session: Session;
    token: string;
  }>("/api/auth/verify-otp", { xNumber, otp });

  // Store session token and user data
  await SecureStorage.setSessionToken(response.token);
  await SecureStorage.setUserData(response.session.user);

  return response.session;
}

/**
 * Staff login with username and password
 */
export async function staffLogin(
  username: string,
  password: string
): Promise<Session> {
  const response = await api.post<{
    session: Session;
    token: string;
  }>("/api/auth/staff-login", { username, password });

  // Store session token and user data
  await SecureStorage.setSessionToken(response.token);
  await SecureStorage.setUserData(response.session.user);

  return response.session;
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    await api.post("/api/auth/logout", {});
  } finally {
    // Always clear local storage
    await SecureStorage.clearAll();
  }
}

/**
 * Get current session
 */
export async function getSession(): Promise<Session | null> {
  try {
    const user = await SecureStorage.getUserData<SessionUser>();
    if (!user) return null;

    // Validate session with server
    const response = await api.get<{ session: Session }>("/api/auth/session");
    return response.session;
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await SecureStorage.getSessionToken();
  return !!token;
}
