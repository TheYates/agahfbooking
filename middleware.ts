import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PUBLIC_API_ROUTES = [
  "/api/auth/",
  "/api/test",
  "/api/departments",
  "/api/test-rls",
  "/api/settings/public",
];

const CLIENT_API_ROUTES = [
  "/api/appointments/client",
  "/api/clients/me",
];

const STAFF_API_ROUTES = [
  "/api/admin/",
  "/api/reports/",
  "/api/users/",
];

function matchesPath(path: string, patterns: string[]): boolean {
  return patterns.some((pattern) => path.startsWith(pattern));
}

function getEdgeSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

async function validateSession(request: NextRequest): Promise<{ 
  valid: boolean; 
  role?: string; 
  xNumber?: string;
  userId?: number;
  userType?: string;
}> {
  const sessionId = request.cookies.get("session_id")?.value;
  
  if (!sessionId) {
    return { valid: false };
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sessionId)) {
    return { valid: false };
  }

  const supabase = getEdgeSupabaseClient();
  if (!supabase) {
    return { valid: false };
  }

  try {
    const { data: session, error } = await supabase
      .from("sessions")
      .select("user_id, user_type, role, x_number, expires_at, is_revoked")
      .eq("id", sessionId)
      .single();

    if (error || !session) {
      return { valid: false };
    }

    if (session.is_revoked) {
      return { valid: false };
    }

    const expiresAt = new Date(session.expires_at as string);
    if (expiresAt < new Date()) {
      return { valid: false };
    }

    return {
      valid: true,
      role: session.role as string,
      xNumber: session.x_number as string | undefined,
      userId: session.user_id as number,
      userType: session.user_type as string,
    };
  } catch {
    return { valid: false };
  }
}

function handleApiRoutes(request: NextRequest, pathname: string): Promise<NextResponse> {
  return (async () => {
    if (matchesPath(pathname, PUBLIC_API_ROUTES)) {
      return NextResponse.next();
    }

    const session = await validateSession(request);

    if (!session.valid) {
      const response = NextResponse.json(
        { error: "Unauthorized - Please login" },
        { status: 401 }
      );
      response.cookies.delete("session_id");
      response.cookies.delete("session_token");
      return response;
    }

    if (matchesPath(pathname, STAFF_API_ROUTES)) {
      if (!["receptionist", "admin", "reviewer"].includes(session.role!)) {
        return NextResponse.json(
          { error: "Forbidden - Staff access required" },
          { status: 403 }
        );
      }
    }

    if (pathname.startsWith("/api/admin/")) {
      if (session.role !== "admin") {
        return NextResponse.json(
          { error: "Forbidden - Admin access required" },
          { status: 403 }
        );
      }
    }

    if (matchesPath(pathname, CLIENT_API_ROUTES)) {
      if (session.role !== "client") {
        return NextResponse.json(
          { error: "Forbidden - Client access required" },
          { status: 403 }
        );
      }

      const { searchParams } = new URL(request.url);
      const requestedXNumber = searchParams.get("xNumber");

      if (requestedXNumber && requestedXNumber !== session.xNumber) {
        return NextResponse.json(
          { error: "Forbidden - Can only access your own data" },
          { status: 403 }
        );
      }
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-session-role", session.role!);
    requestHeaders.set("x-session-user-id", String(session.userId));
    requestHeaders.set("x-session-user-type", session.userType!);
    if (session.xNumber) {
      requestHeaders.set("x-session-xnumber", session.xNumber);
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  })();
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname === "/login" ||
    pathname === "/staff-login"
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return handleApiRoutes(request, pathname);
  }

  const sessionId = request.cookies.get("session_id");

  if (pathname.startsWith("/admin")) {
    if (!sessionId) {
      return NextResponse.redirect(new URL("/staff-login", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/dashboard")) {
    if (!sessionId) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
