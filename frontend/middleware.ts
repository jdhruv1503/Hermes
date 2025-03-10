import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const authSession = request.cookies.get("auth_session")
  const isAuthenticated = authSession?.value === "authenticated"
  const isLoginPage = request.nextUrl.pathname === "/"

  // If user is not authenticated and trying to access a protected route
  if (!isAuthenticated && !isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // If user is authenticated and trying to access login page
  if (isAuthenticated && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

