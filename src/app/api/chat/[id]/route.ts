import { NextRequest } from 'next/server';
import { requireApiGroupMember, apiError, ApiGuardError, isApiSupervisor } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { notifyUser } from '@/lib/notifications';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  let user = await requireApiGroupMember().catch((e: unknown) => e as ApiGuardError);
  if (user instanceof ApiGuardError) return user.response;

  const { id } = await ctx.params;
  const message = await prisma.chatMessage.findFirst({
    where: { id, groupId: user.membership!.groupId, status: 'ACTIVE' },
  });
  if (!message) return apiError('الرسالة غير موجودة', 404);

  const allowed = message.senderId === user.id || isApiSupervisor(user);
  if (!allowed) return apiError('غير مصرح لك بحذف هذه الرسالة', 403);

  await prisma.chatMessage.update({ where: { id }, data: { status: 'DELETED' } });
  return apiOk();
}

function apiOk() {
  return Response.json({ ok: true });
}