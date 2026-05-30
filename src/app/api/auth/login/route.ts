import { AUTH_COOKIE_NAME, createSessionCookieValue, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const username = typeof body?.username === 'string' ? body.username : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  const user = await prisma.user.findUnique({ where: { username } });

  if (!user?.username || !user.password || user.password !== (await hashPassword(password))) {
    return NextResponse.json({ message: 'Invalid login or password.' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: createSessionCookieValue({
      role: 'employee',
      username: user.username,
      name: user.name,
      access: user.access ?? [],
    }),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  return response;
}
