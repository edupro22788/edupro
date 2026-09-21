import { NextRequest } from 'next/server';
import {
  requireApiGroupMember, ok, apiError, ApiGuardError, isApiSupervisor,
} from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

type Ctx = { params: Promise<{ userId: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  let user = await requireApiGroupMember().catch((e: unknown) => e as ApiGuardError);
  if (user instanceof ApiGuardError) return user.response;
  if (!isApiSupervisor(user)) return apiError('فقط مشرف الفوج يمكنه إدارة الحظر', 403);

  const { userId } = await ctx.params;
  const groupId = user.membership!.groupId;

  if (userId === user.id) return apiError('لا يمكنك حظر نفسك', 400);

  const body = await req.json().catch(() => ({}));
  const unban = body?.action === 'unban';

  const target = await prisma.membership.findUnique({ where: { userId } });
  if (!target || target.groupId !== groupId) return apiError('العضو غير موجود في فوجك', 404);

  await prisma.membership.update({
    where: { userId },
    data: { chatBannedAt: unban ? null : new Date() },
  });

  return ok({ banned: !unban });
}