import { type NextRequest, NextResponse } from "next/server";

// Middleware works with BetterAuth by checking the session_token cookie
// which is maintained for backward compatibility
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes, static files, and auth pages
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname === "/login" ||
    pathname === "/staff-login"
  ) {
    return NextResponse.next();
  }

  // Check for session token
  const sessionToken = request.cookies.get("session_token");

  // If accessing dashboard without session, redirect to login
  if (pathname.startsWith("/dashboard")) {
    if (!sessionToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Try to parse the session token to validate it
    try {
      const userData = JSON.parse(sessionToken.value);

      // Check for required fields - handle both client and staff sessions
      const hasClientFields = userData.id && userData.xNumber && userData.role;
      const hasStaffFields =
        userData.id && userData.role && userData.employee_id;

      if (!hasClientFields && !hasStaffFields) {
        // Invalid session, redirect to login
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("session_token");
        return response;
      }

      // Validate role
      if (!["client", "receptionist", "admin"].includes(userData.role)) {
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("session_token");
        return response;
      }
    } catch (error) {
      // Invalid JSON, redirect to login
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("session_token");
      return response;
    }
  }

  // Redirect root to login
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
