import { NextResponse } from 'next/server';

export function middleware(request) {
  // Get the pathname of the request
  const { pathname } = request.nextUrl;
  
  // Check if the user is authenticated by looking for the auth_token (HTTP-only cookie)
  const isAuthenticated = request.cookies.has('auth_token');
  
  // Define protected routes (routes that require authentication)
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const is404 = pathname === '/404';
  
  // If it's a dashboard route or 404 and the user is not authenticated, redirect to login
  if ((isDashboardRoute || is404) && !isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // If it's a 404 page and the user is authenticated, redirect to dashboard
  if (is404 && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // If it's the login page and the user is authenticated, redirect to dashboard
  if (pathname === '/' && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Otherwise, continue with the request
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 