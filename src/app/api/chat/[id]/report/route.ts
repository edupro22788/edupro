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
  const message = await prisma.chatMessage.findFirst({
    where: { id, groupId: user.membership!.groupId },
  });
  if (!message) return apiError('الرسالة غير موجودة', 404);
  if (message.senderId === user.id) return apiError('لا يمكنك الإبلاغ عن رسالتك', 400);

  const body = await req.json().catch(() => ({}));
  const reason = String(body?.reason || '');
  if (!REPORT_REASONS.includes(reason as never)) return apiError('سبب البلاغ غير صالح');

  await prisma.report.create({
    data: {
      groupId: user.membership!.groupId,
      reporterId: user.id,
      type: 'CHAT_MESSAGE',
      targetId: message.id,
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
      body: `تلقي البلاغ حول رسالة دردشة: ${reason}`,
      link: '/room/chat',
    });
  }

  return ok();
}

function ok() {
  return Response.json({ ok: true });
}