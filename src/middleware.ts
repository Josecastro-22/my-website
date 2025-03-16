import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if the request is for the bookings page
  if (request.nextUrl.pathname.startsWith('/bookings')) {
    const isLoggedIn = request.cookies.get('isLoggedIn')?.value;

    if (!isLoggedIn) {
      // Redirect to login if not logged in
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/bookings/:path*',
}; 