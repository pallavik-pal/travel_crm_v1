import { AUTH_COOKIE_NAME, hasRouteAccess, readSessionCookieValue } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

const protectedPagePrefixes: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/tours': 'tours',
  '/bookings': 'bookings',
  '/travelers': 'travelers',
  '/payments': 'payments',
  '/customer-payments': 'customer-payments',
  '/operations': 'operations',
  '/documents': 'documents',
  '/reports': 'reports',
  '/settings': 'settings',
};

function getAccessKey(pathname: string) {
  const entry = Object.entries(protectedPagePrefixes).find(
    ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  return entry?.[1] || null;
}

function getSession(request: NextRequest) {
  return readSessionCookieValue(request.cookies.get(AUTH_COOKIE_NAME)?.value);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = getSession(request);

  if (pathname === '/') {
    return NextResponse.redirect(new URL(session ? '/dashboard' : '/login', request.url));
  }

  if (pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (pathname === '/admin' && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if ((pathname === '/employee-access' || pathname === '/reports') && session?.role !== 'admin') {
    return session
      ? NextResponse.redirect(new URL('/dashboard', request.url))
      : NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url));
  }

  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/admin') && session?.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (pathname.startsWith('/api/reports') && session?.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (pathname.startsWith('/api/') && !session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const accessKey = getAccessKey(pathname);

  if (accessKey && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);

    return NextResponse.redirect(loginUrl);
  }

  if (accessKey && !hasRouteAccess(session, accessKey)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|pp-logo.png).*)'],
};
