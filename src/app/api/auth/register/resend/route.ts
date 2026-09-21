import { NextRequest } from 'next/server';
import { apiError, ok } from '@/lib/api-helpers';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { createAndSendCode } from '@/lib/verify';

export async function POST(_req: NextRequest) {
  const session = await getSession();
  if (!session.userId) return apiError('يرجى التسجيل أولًا', 401);

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return apiError('المستخدم غير موجود', 404);

  const { plain, mail } = await createAndSendCode(user.id, user.email);
  return ok({
    mode: mail.mode,
    ...(mail.mode === 'test' ? { testCode: plain } : {}),
  });
}