import { NextRequest } from 'next/server';
import { apiError, ok } from '@/lib/api-helpers';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { createAndSendCode } from '@/lib/verify';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.reg?.passwordHash) return apiError('يرجى إعادة التسجيل من البداية', 400);

  const body = await req.json().catch(() => ({}));
  const email = String(body?.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return apiError('البريد الإلكتروني غير صالح');

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return apiError('هذا البريد الإلكتروني مسجّل بالفعل', 409);
  }

  const user = await prisma.user.create({
    data: {
      firstName: session.reg.firstName,
      lastName: session.reg.lastName,
      email,
      passwordHash: session.reg.passwordHash,
      role: 'STUDENT',
    },
  });

  const { plain, mail } = await createAndSendCode(user.id, email);

  session.reg = undefined;
  session.userId = user.id;
  await session.save();

  return ok({
    userId: user.id,
    email,
    mode: mail.mode,
    // في وضع الاختبار نعرض الرمز مباشرة في واجهة المستخدم
    ...(mail.mode === 'test' ? { testCode: plain } : {}),
  });
}