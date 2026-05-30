export const AUTH_COOKIE_NAME = 'travel_crm_admin_session';

export const DEFAULT_ADMIN_USERNAME = 'admin';
export const DEFAULT_ADMIN_PASSWORD = 'admin123';

export const ADMIN_ACCESS = [
  'dashboard',
  'tours',
  'bookings',
  'travelers',
  'payments',
  'customer-payments',
  'operations',
  'documents',
  'settings',
] as const;

export type AccessKey = (typeof ADMIN_ACCESS)[number];

export type AuthSession = {
  role: 'admin' | 'employee';
  username: string;
  name: string;
  access: string[];
};

export function getAdminUsername() {
  return process.env.ADMIN_USERNAME || DEFAULT_ADMIN_USERNAME;
}

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
}

export function getAdminSessionToken() {
  return process.env.ADMIN_SESSION_TOKEN || 'travel-crm-admin-session';
}

export function createSessionCookieValue(session: AuthSession) {
  return encodeURIComponent(JSON.stringify(session));
}

export function readSessionCookieValue(value?: string): AuthSession | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as AuthSession;

    if (!parsed?.role || !parsed?.username || !Array.isArray(parsed.access)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function hasRouteAccess(session: AuthSession | null, accessKey: string) {
  if (!session) {
    return false;
  }

  return session.role === 'admin' || session.access.includes(accessKey);
}

export async function hashPassword(password: string) {
  const crypto = await import('crypto');

  return crypto.createHash('sha256').update(password).digest('hex');
}
