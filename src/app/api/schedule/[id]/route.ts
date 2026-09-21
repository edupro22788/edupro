import { NextRequest } from 'next/server';
import { requireApiGroupMember, ok, apiError, ApiGuardError, isApiSupervisor } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  let user = await requireApiGroupMember().catch((e: unknown) => e as ApiGuardError);
  if (user instanceof ApiGuardError) return user.response;
  if (!isApiSupervisor(user)) return apiError('فقط مشرف الفوج يعدّل الجدول', 403);

  const { id } = await ctx.params;
  const entry = await prisma.weeklySchedule.findFirst({
    where: { id, groupId: user.membership!.groupId },
  });
  if (!entry) return apiError('الحصة غير موجودة', 404);

  await prisma.weeklySchedule.delete({ where: { id } });
  return ok();
}