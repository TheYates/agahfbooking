import { type NextRequest, NextResponse } from "next/server";

/**
 * API Authentication Middleware
 * 
 * This middleware validates x-number based authentication for API routes.
 * It checks the session_token cookie and validates the user's identity.
 */

export interface SessionData {
  id: number;
  xNumber?: string;
  name: string;
  phone?: string;
  category?: string;
  role: "client" | "receptionist" | "admin" | "reviewer";
  username?: string;
  employee_id?: string;
  loginTime: string;
}

/**
 * Validate session token and return session data
 */
export function validateSession(request: NextRequest): SessionData | null {
  const sessionToken = request.cookies.get("session_token");
  
  if (!sessionToken?.value) {
    return null;
  }

  try {
    const sessionData: SessionData = JSON.parse(sessionToken.value);
    
    // Validate required fields
    if (!sessionData.id || !sessionData.role) {
      return null;
    }

    // Validate role
    const validRoles = ["client", "receptionist", "admin", "reviewer"];
    if (!validRoles.includes(sessionData.role)) {
      return null;
    }

    // Check session expiration (24 hours)
    const loginTime = new Date(sessionData.loginTime);
    const now = new Date();
    const hoursSinceLogin = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLogin > 24) {
      return null;
    }

    return sessionData;
  } catch {
    return null;
  }
}

/**
 * Check if user is a client (x-number based auth)
 */
export function isClient(session: SessionData): boolean {
  return session.role === "client" && !!session.xNumber;
}

/**
 * Check if user is staff (username/password auth)
 */
export function isStaff(session: SessionData): boolean {
  return ["receptionist", "admin", "reviewer"].includes(session.role);
}

/**
 * Check if user is admin
 */
export function isAdmin(session: SessionData): boolean {
  return session.role === "admin";
}

/**
 * Middleware handler for API routes
 * Usage: export const GET = withAuth(handler, { requireClient: true })
 */
export function withAuth(
  handler: (request: NextRequest, session: SessionData) => Promise<NextResponse>,
  options: {
    requireClient?: boolean;
    requireStaff?: boolean;
    requireAdmin?: boolean;
    allowGuest?: boolean;
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const session = validateSession(request);

    // If no session and guest not allowed
    if (!session && !options.allowGuest) {
      return NextResponse.json(
        { error: "Unauthorized - Please login" },
        { status: 401 }
      );
    }

    // If session exists, check role requirements
    if (session) {
      if (options.requireClient && !isClient(session)) {
        return NextResponse.json(
          { error: "Forbidden - Client access required" },
          { status: 403 }
        );
      }

      if (options.requireStaff && !isStaff(session)) {
        return NextResponse.json(
          { error: "Forbidden - Staff access required" },
          { status: 403 }
        );
      }

      if (options.requireAdmin && !isAdmin(session)) {
        return NextResponse.json(
          { error: "Forbidden - Admin access required" },
          { status: 403 }
        );
      }
    }

    // Call the handler with session (or null if guest)
    return handler(request, session!);
  };
}

/**
 * Validate that a client can only access their own x-number data
 */
export function validateXNumberAccess(
  session: SessionData,
  requestedXNumber: string
): boolean {
  if (!isClient(session)) {
    // Staff can access any x-number
    return true;
  }
  
  // Client can only access their own x-number
  return session.xNumber === requestedXNumber;
}

/**
 * Standard error responses
 */
export const AuthErrors = {
  unauthorized: () =>
    NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  
  forbidden: (message = "Access denied") =>
    NextResponse.json({ error: message }, { status: 403 }),
  
  invalidXNumber: () =>
    NextResponse.json(
      { error: "Invalid x-number format" },
      { status: 400 }
    ),
  
  xNumberMismatch: () =>
    NextResponse.json(
      { error: "You can only access your own data" },
      { status: 403 }
    ),
};
