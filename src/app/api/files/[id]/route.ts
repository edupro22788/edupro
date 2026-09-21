import { NextRequest } from 'next/server';
import { requireApiGroupMember, ok, apiError, ApiGuardError, isApiSupervisor } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { deleteStoredFile } from '@/lib/storage';
import { notifyUser } from '@/lib/notifications';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  let user = await requireApiGroupMember().catch((e: unknown) => e as ApiGuardError);
  if (user instanceof ApiGuardError) return user.response;

  const { id } = await ctx.params;
  const file = await prisma.studyFile.findFirst({
    where: { id, groupId: user.membership!.groupId },
    include: {
      uploader: { select: { id: true, firstName: true, lastName: true, gender: true } },
      subject: { select: { id: true, name: true } },
    },
  });
  if (!file) return apiError('الملف غير موجود', 404);

  return ok({ file });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  let user = await requireApiGroupMember().catch((e: unknown) => e as ApiGuardError);
  if (user instanceof ApiGuardError) return user.response;

  const { id } = await ctx.params;
  const file = await prisma.studyFile.findFirst({
    where: { id, groupId: user.membership!.groupId },
  });
  if (!file) return apiError('الملف غير موجود', 404);

  const body = await req.json().catch(() => ({}));

  // حذف ناعم: صاحب الملف أو المشرف
  if (body.action === 'delete') {
    const allowed = file.uploaderId === user.id || isApiSupervisor(user);
    if (!allowed) return apiError('غير مصرح لك بحذف هذا الملف', 403);

    await prisma.studyFile.update({
      where: { id },
      data: { status: 'DELETED' },
    });
    deleteStoredFile(file.storedPath);

    if (file.uploaderId !== user.id) {
      await notifyUser(file.uploaderId, {
        type: 'CONTENT_STATUS',
        title: 'حُذف ملفك',
        body: `حُذف ملف «${file.title}» من قبل إدارة الفوج`,
        link: '/room/subjects',
      });
    }
    return ok();
  }

  // تعديل العنوان/الوصف: صاحب الملف
  if (file.uploaderId === user.id) {
    const data: { title?: string; description?: string } = {};
    if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim().slice(0, 120);
    if (typeof body.description === 'string') data.description = body.description.trim().slice(0, 500);
    const updated = await prisma.studyFile.update({ where: { id }, data });
    return ok({ file: updated });
  }

  return apiError('غير مصرح لك', 403);
}