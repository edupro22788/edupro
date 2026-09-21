import { NextRequest } from 'next/server';
import { apiError, ok } from '@/lib/api-helpers';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) return apiError('يرجى التسجيل أولًا', 401);

  const body = await req.json().catch(() => ({}));
  const code = String(body?.code || '').trim();
  if (!/^\d{6}$/.test(code)) return apiError('أدخل رمزًا من 6 أرقام');

  const record = await prisma.emailVerification.findFirst({
    where: { userId: session.userId, usedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  if (!record) return apiError('لا يوجد رمز فعال، اطلب رمزًا جديدًا');

  if (record.expiresAt < new Date()) {
    return apiError('انتهت صلاحية الرمز، اطلب رمزًا جديدًا');
  }

  const match = await bcrypt.compare(code, record.code);
  if (!match) return apiError('الرمز غير صحيح');

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.emailVerification.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return ok({ verified: true });
}