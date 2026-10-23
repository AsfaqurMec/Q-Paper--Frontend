import { NextResponse, type NextRequest } from "next/server";

const ACCESS_COOKIE = "examcraft_access";
const USER_COOKIE = "examcraft_user";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  const rawUser = request.cookies.get(USER_COOKIE)?.value;

  if ((pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const fullNext = request.nextUrl.search ? `${pathname}${request.nextUrl.search}` : pathname;
    url.searchParams.set("next", fullNext);
    return NextResponse.redirect(url);
  }

  if ((pathname === "/login" || pathname === "/register") && token) {
    const next = request.nextUrl.searchParams.get("next");
    const redirectPath = next && next.startsWith("/") ? next : "/dashboard";
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  if (pathname.startsWith("/admin")) {
    try {
      const user = rawUser ? JSON.parse(rawUser) : null;
      if (user?.role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/register"]
};
