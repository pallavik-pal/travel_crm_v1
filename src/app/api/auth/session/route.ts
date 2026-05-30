import { AUTH_COOKIE_NAME, readSessionCookieValue } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const session = readSessionCookieValue(request.cookies.get(AUTH_COOKIE_NAME)?.value);

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(session);
}
