import { NextRequest } from 'next/server';
import { apiError, ok } from '@/lib/api-helpers';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { ensureSupervisorFreshness } from '@/lib/supervisor';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = String(body?.email || '').trim().toLowerCase();
  const password = String(body?.password || '');

  if (!email || !password) return apiError('أدخل البريد الإلكتروني وكلمة المرور');

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return apiError('البريد الإلكتروني أو كلمة المرور غير صحيحة', 401);

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return apiError('البريد الإلكتروني أو كلمة المرور غير صحيحة', 401);

  const session = await getSession();
  session.userId = user.id;
  await session.save();

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), loginCount: { increment: 1 } },
  });

  const membership = await prisma.membership.findUnique({
    where: { userId: user.id },
    include: { group: true },
  });

  // فحص غياب المشرف الحالي (أكثر من 3 أيام) عند كل تسجيل دخول
  if (membership) {
    await ensureSupervisorFreshness(membership.groupId);
  }

  return ok({
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      emailVerified: Boolean(user.emailVerifiedAt),
      hasGroup: Boolean(membership),
      groupName: membership?.group.name || null,
    },
  });
}