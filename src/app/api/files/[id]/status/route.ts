import { NextRequest } from 'next/server';
import { requireApiGroupMember, ok, apiError, ApiGuardError, isApiSupervisor } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { notifyUser } from '@/lib/notifications';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  let user = await requireApiGroupMember().catch((e: unknown) => e as ApiGuardError);
  if (user instanceof ApiGuardError) return user.response;
  if (!isApiSupervisor(user)) return apiError('فقط مشرف الفوج يقرر نشر المحتوى', 403);

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const action = String(body?.action || '').trim();
  if (!['approve', 'reject'].includes(action)) return apiError('إجراء غير صالح');

  const file = await prisma.studyFile.findFirst({
    where: { id, groupId: user.membership!.groupId, status: { not: 'DELETED' } },
  });
  if (!file) return apiError('الملف غير موجود', 404);

  const rejectReason = action === 'reject' ? String(body?.reason || 'محتوى غير مناسب').slice(0, 300) : null;

  const updated = await prisma.studyFile.update({
    where: { id },
    data: {
      status: action === 'approve' ? 'PUBLISHED' : 'REJECTED',
      rejectReason,
    },
  });

  if (file.uploaderId !== user.id) {
    await notifyUser(file.uploaderId, {
      type: 'CONTENT_STATUS',
      title: action === 'approve' ? 'تم نشر ملفك ✅' : 'رُفض ملفك ❌',
      body:
        action === 'approve'
          ? `تم نشر «${file.title}» وأصبح متاحًا للفوج`
          : `رُفض «${file.title}»${rejectReason ? ` — السبب: ${rejectReason}` : ''}`,
      link: '/room/subjects',
    });
  }

  return ok({ file: updated });
}