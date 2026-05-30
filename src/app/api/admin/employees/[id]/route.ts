import { ADMIN_ACCESS, AUTH_COOKIE_NAME, hashPassword, readSessionCookieValue } from '@/lib/auth';
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

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const data: {
    name?: string;
    email?: string;
    username?: string;
    password?: string;
    access?: string[];
  } = {};

  if (typeof body?.name === 'string') data.name = body.name.trim();
  if (typeof body?.email === 'string') data.email = body.email.trim();
  if (typeof body?.username === 'string') data.username = body.username.trim();
  if (Array.isArray(body?.access)) data.access = cleanAccess(body.access);
  if (typeof body?.password === 'string' && body.password) data.password = await hashPassword(body.password);

  try {
    const user = await prisma.user.update({
      where: { id },
      data,
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

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ message: 'Unable to update employee.' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
