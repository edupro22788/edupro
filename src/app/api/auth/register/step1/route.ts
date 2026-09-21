import { NextRequest } from 'next/server';
import { apiError, ok } from '@/lib/api-helpers';
import { getSession } from '@/lib/session';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const session = await getSession();
  const body = await req.json().catch(() => ({}));
  const { firstName, lastName, password } = body || {};

  const f = String(firstName || '').trim();
  const l = String(lastName || '').trim();
  if (!f || !l) return apiError('يرجى إدخال الاسم الأول والاسم الأخير');
  if (f.length > 40 || l.length > 40) return apiError('الاسم طويل جدًا');
  if (!password || String(password).length < 6) return apiError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
  if (String(password).length > 72) return apiError('كلمة المرور طويلة جدًا');

  session.reg = {
    firstName: f,
    lastName: l,
    passwordHash: await bcrypt.hash(String(password), 12),
  };
  await session.save();

  return ok({ firstName: f, lastName: l });
}