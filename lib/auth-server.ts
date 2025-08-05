"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "./types";

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token");

    if (!sessionToken?.value) {
      return null;
    }

    // Try to parse the session token
    let userData;
    try {
      userData = JSON.parse(sessionToken.value);
    } catch (parseError) {
      console.error("Failed to parse session token:", parseError);
      // Don't delete cookie here - let middleware handle it
      return null;
    }

    // Validate user data structure
    if (
      !userData ||
      typeof userData !== "object" ||
      !userData.id ||
      !userData.name ||
      !userData.role
    ) {
      console.error("Invalid user data structure:", userData);
      return null;
    }

    return userData as User;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireAdminAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/login");
  }
  return user;
}

export async function requireStaffAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user || !["admin", "receptionist"].includes(user.role)) {
    redirect("/login");
  }
  return user;
}

export async function requireClientAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user || user.role !== "client") {
    redirect("/login");
  }
  return user;
}

export async function redirectBasedOnRole(user: User) {
  if (user.role === "admin") {
    redirect("/dashboard");
  } else if (user.role === "receptionist") {
    redirect("/dashboard");
  } else if (user.role === "client") {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}

// Server Action to clear invalid session cookies
export async function clearInvalidSession() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("session_token");
    return { success: true };
  } catch (error) {
    console.error("Error clearing session:", error);
    return { success: false };
  }
}
