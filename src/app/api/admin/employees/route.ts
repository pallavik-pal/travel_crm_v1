import { ADMIN_ACCESS, hashPassword, readSessionCookieValue, AUTH_COOKIE_NAME } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

function requireAdmin(request: NextRequest) {
  const session = readSessionCookieValue(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  return session?.role === 'admin';
}

function cleanAccess(value: unknown) {
  const incoming = Array.isArray(value) ? value : [];
  return incoming.filter((item): item is string => ADMIN_ACCESS.includes(item));
}

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      role: true,
      access: true,
      createdAt: true,
    },
  });

  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const username = typeof body?.username === 'string' ? body.username.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const access = cleanAccess(body?.access);

  if (!username || !password) {
    return NextResponse.json({ message: 'Username and password are required.' }, { status: 400 });
  }

  try {
    const user = await prisma.user.create({
      data: {
        name: username,
        email: `${username}@employee.local`,
        username,
        password: await hashPassword(password),
        role: 'staff',
        access,
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        access: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Employee email or username already exists.' }, { status: 409 });
  }
}
