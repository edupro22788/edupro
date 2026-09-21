import { NextRequest } from 'next/server';
import { requireApiGroupMember, apiError, ApiGuardError } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { notifyUser } from '@/lib/notifications';
import { REPORT_REASONS } from '@/lib/constants';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  let user = await requireApiGroupMember().catch((e: unknown) => e as ApiGuardError);
  if (user instanceof ApiGuardError) return user.response;

  const { id } = await ctx.params;
  const ann = await prisma.announcement.findFirst({
    where: { id, groupId: user.membership!.groupId },
  });
  if (!ann) return apiError('الإعلان غير موجود', 404);
  if (ann.authorId === user.id) return apiError('لا يمكنك الإبلاغ عن إعلانك', 400);

  const body = await req.json().catch(() => ({}));
  const reason = String(body?.reason || '');
  if (!REPORT_REASONS.includes(reason as never)) return apiError('سبب البلاغ غير صالح');

  await prisma.report.create({
    data: {
      groupId: user.membership!.groupId,
      reporterId: user.id,
      type: 'ANNOUNCEMENT',
      targetId: ann.id,
      reason,
      content: String(body?.content || '').trim().slice(0, 500) || undefined,
    },
  });

  const sup = await prisma.group.findUnique({
    where: { id: user.membership!.groupId },
    select: { supervisorId: true },
  });
  if (sup?.supervisorId && sup.supervisorId !== user.id) {
    await notifyUser(sup.supervisorId, {
      type: 'SYSTEM',
      title: 'بلاغ جديد ⚠️',
      body: `بلاغ حول إعلان «${ann.title}»: ${reason}`,
      link: '/room/announcements',
    });
  }

  return ok();
}

function ok() {
  return Response.json({ ok: true });
}