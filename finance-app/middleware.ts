import { NextResponse, type NextRequest } from "next/server";

const authCookieName = "finance_session";
const protectedRoutes = ["/dashboard", "/transactions", "/accounts", "/settings"];

export function middleware(request: NextRequest) {
  const isProtected = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );
  const hasSession = request.cookies.has(authCookieName);

  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (request.nextUrl.pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/dashboard/:path*", "/transactions/:path*", "/accounts/:path*", "/settings/:path*"]
};
