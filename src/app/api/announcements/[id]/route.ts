import { NextRequest } from 'next/server';
import { requireApiGroupMember, ok, apiError, ApiGuardError, isApiSupervisor } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { notifyUser } from '@/lib/notifications';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  let user = await requireApiGroupMember().catch((e: unknown) => e as ApiGuardError);
  if (user instanceof ApiGuardError) return user.response;

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  if (body.action === 'togglePin') {
    if (!isApiSupervisor(user)) return apiError('فقط مشرف الفوج يثبّت الإعلانات', 403);
    const a = await prisma.announcement.findFirst({
      where: { id, groupId: user.membership!.groupId },
    });
    if (!a) return apiError('الإعلان غير موجود', 404);
    const updated = await prisma.announcement.update({
      where: { id },
      data: { pinned: !a.pinned },
    });
    return ok({ announcement: updated });
  }

  if (body.action === 'delete') {
    const a = await prisma.announcement.findFirst({
      where: { id, groupId: user.membership!.groupId },
    });
    if (!a) return apiError('الإعلان غير موجود', 404);
    const allowed = a.authorId === user.id || isApiSupervisor(user);
    if (!allowed) return apiError('غير مصرح لك', 403);
    const updated = await prisma.announcement.update({ where: { id }, data: { status: 'DELETED' } });
    if (a.authorId !== user.id) {
      await notifyUser(a.authorId, {
        type: 'CONTENT_STATUS',
        title: 'حُذف إعلانك',
        body: `حُذف «${a.title}» من قبل إدارة الفوج`,
      });
    }
    return ok({ announcement: updated });
  }

  return apiError('إجراء غير صالح', 400);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  return PATCH(Object.assign(req as NextRequest, { json: async () => ({ action: 'delete' }) }), ctx);
}