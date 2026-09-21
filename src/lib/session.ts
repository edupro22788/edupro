import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

export type SessionData = {
  userId?: string;
  reg?: {
    firstName: string;
    lastName: string;
    passwordHash: string;
  };
};

export const sessionOptions = {
  password: process.env.SESSION_SECRET || 'edupro-secret-change-me-please-2026',
  cookieName: 'edupro_session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}