import { NextRequest } from 'next/server';
import { requireApiUser, ok, apiError, ApiGuardError, canAccessSubject } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  let user = await requireApiUser().catch((e: unknown) => e as ApiGuardError);
  if (user instanceof ApiGuardError) return user.response;

  const { id } = await ctx.params;
  const subject = await prisma.subject.findUnique({ where: { id } });
  if (!subject || !canAccessSubject(user, subject)) return apiError('المقياس غير موجود', 404);

  return ok({ subject });
}