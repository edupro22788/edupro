import { requireApiGroupMember, ok, apiError, ApiGuardError } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import type { NextRequest } from 'next/server';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, ctx: Ctx) {
  let user = await requireApiGroupMember().catch((e: unknown) => e as ApiGuardError);
  if (user instanceof ApiGuardError) return user.response;

  const { id } = await ctx.params;
  const exists = await prisma.notification.findFirst({ where: { id, userId: user.id } });
  if (!exists) return apiError('الإشعار غير موجود', 404);

  await prisma.notification.update({ where: { id }, data: { read: true } });
  return ok();
}