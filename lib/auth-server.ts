"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "./types";
import { getSession, revokeSession } from "./session-service";

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    if (!sessionId) {
      return null;
    }

    const session = await getSession(sessionId);
    
    if (!session) {
      return null;
    }

    return {
      id: session.userId,
      name: session.name,
      role: session.role,
      xNumber: session.xNumber,
      phone: session.phone,
      category: session.category,
      employeeId: session.employeeId,
    };
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
    redirect("/staff-login");
  }
  return user;
}

export async function requireStaffAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user || !["admin", "receptionist", "reviewer"].includes(user.role)) {
    redirect("/staff-login");
  }
  return user;
}

export async function requireReviewerAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user || !["admin", "reviewer"].includes(user.role)) {
    redirect("/staff-login");
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
  } else if (user.role === "reviewer") {
    redirect("/dashboard/reviews");
  } else if (user.role === "client") {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}

export async function clearInvalidSession() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;
    
    if (sessionId) {
      await revokeSession(sessionId);
    }
    
    cookieStore.delete("session_id");
    cookieStore.delete("session_token");
    return { success: true };
  } catch (error) {
    console.error("Error clearing session:", error);
    return { success: false };
  }
}
