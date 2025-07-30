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

    // Validate session data structure
    if (!userData || typeof userData !== "object") {
      console.error("Invalid session data structure");
      // Don't delete cookie here - let middleware handle it
      return null;
    }

    // Check required fields - handle both client and staff sessions
    const hasClientFields =
      userData.id && userData.xNumber && userData.role && userData.name;
    const hasStaffFields =
      userData.id && userData.role && userData.name && userData.employee_id;

    if (!hasClientFields && !hasStaffFields) {
      console.error("Missing required session fields:", userData);
      // Don't delete cookie here - let middleware handle it
      return null;
    }

    // Ensure role is valid
    if (!["client", "receptionist", "admin"].includes(userData.role)) {
      console.error("Invalid user role:", userData.role);
      // Don't delete cookie here - let middleware handle it
      return null;
    }

    return {
      id: userData.id,
      xNumber: userData.xNumber || userData.employee_id || "", // Use employee_id for staff
      name: userData.name,
      phone: userData.phone || "",
      category: userData.category || "",
      role: userData.role,
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    redirect("/unauthorized");
  }
  return user;
}

// Server Action to clear invalid session cookies
export async function clearInvalidSession() {
  "use server";

  try {
    const cookieStore = await cookies();
    cookieStore.delete("session_token");
    return { success: true };
  } catch (error) {
    console.error("Error clearing session:", error);
    return { success: false };
  }
}
