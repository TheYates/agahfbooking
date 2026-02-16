import { type NextRequest, NextResponse } from "next/server";
import { getSession, type SessionData } from "./session-service";

export type { SessionData };

export function isClient(session: SessionData): boolean {
  return session.role === "client" && !!session.xNumber;
}

export function isStaff(session: SessionData): boolean {
  return ["receptionist", "admin", "reviewer"].includes(session.role);
}

export function isAdmin(session: SessionData): boolean {
  return session.role === "admin";
}

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
    const sessionId = request.cookies.get("session_id")?.value;

    let session: SessionData | null = null;
    if (sessionId) {
      session = await getSession(sessionId);
    }

    if (!session && !options.allowGuest) {
      return NextResponse.json(
        { error: "Unauthorized - Please login" },
        { status: 401 }
      );
    }

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

    return handler(request, session!);
  };
}

export function validateXNumberAccess(
  session: SessionData,
  requestedXNumber: string
): boolean {
  if (!isClient(session)) {
    return true;
  }
  return session.xNumber === requestedXNumber;
}

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
