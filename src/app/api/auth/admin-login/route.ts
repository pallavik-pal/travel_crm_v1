import {
  ADMIN_ACCESS,
  AUTH_COOKIE_NAME,
  createSessionCookieValue,
  getAdminPassword,
  getAdminUsername,
} from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const username = typeof body?.username === 'string' ? body.username : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (username !== getAdminUsername() || password !== getAdminPassword()) {
    return NextResponse.json({ message: 'Invalid admin login or password.' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: createSessionCookieValue({
      role: 'admin',
      username,
      name: 'Admin',
      access: [...ADMIN_ACCESS],
    }),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  return response;
}
