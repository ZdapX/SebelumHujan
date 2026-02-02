import { NextResponse } from 'next/server';
import { verifyToken } from './app/lib/auth';

export async function middleware(request) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/api/auth/login', '/api/auth/register'];
  
  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // If user is not authenticated and trying to access protected route
  if (!token && !isPublicRoute && !pathname.startsWith('/api/auth')) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If user is authenticated and trying to access login/register
  if (token && (pathname === '/login' || pathname === '/register')) {
    const chatUrl = new URL('/chat', request.url);
    return NextResponse.redirect(chatUrl);
  }

  // Verify token for protected API routes
  if (pathname.startsWith('/api/') && 
      !pathname.startsWith('/api/auth/login') && 
      !pathname.startsWith('/api/auth/register')) {
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Add user info to request headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decoded.userId);
    requestHeaders.set('x-username', decoded.username);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
