import { NextRequest } from 'next/server';
import { requireApiGroupMember, ok, apiError, ApiGuardError } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { notifyUser } from '@/lib/notifications';
import { REPORT_REASONS } from '@/lib/constants';

const TARGETS = {
  FILE: { model: 'studyFile', label: 'ملف' },
  ASSIGNMENT: { model: 'assignment', label: 'واجب' },
  USER: { model: 'user', label: 'مستخدم' },
} as const;

export async function POST(req: NextRequest) {
  let user = await requireApiGroupMember().catch((e: unknown) => e as ApiGuardError);
  if (user instanceof ApiGuardError) return user.response;

  const body = await req.json().catch(() => ({}));
  const type = String(body?.type || '') as keyof typeof TARGETS;
  const targetId = String(body?.targetId || '').trim();
  const reason = String(body?.reason || '');
  const extra = String(body?.content || '').trim().slice(0, 500);

  if (!(type in TARGETS)) return apiError('نوع البلاغ غير صالح');
  if (!targetId) return apiError('الهدف غير محدد');
  if (!REPORT_REASONS.includes(reason as never)) return apiError('سبب البلاغ غير صالح');

  // التحقق من انتماء الهدف لنفس الفوج
  const groupId = user.membership!.groupId;
  let exists = false;
  if (type === 'FILE') {
    exists = Boolean(await prisma.studyFile.findFirst({ where: { id: targetId, groupId } }));
  } else if (type === 'ASSIGNMENT') {
    exists = Boolean(await prisma.assignment.findFirst({ where: { id: targetId, groupId } }));
  } else {
    const target = await prisma.user.findUnique({
      where: { id: targetId },
      include: { membership: true },
    });
    exists = Boolean(target?.membership && target.membership.groupId === groupId);
  }
  if (!exists) return apiError('الهدف غير موجود', 404);

  await prisma.report.create({
    data: {
      groupId,
      reporterId: user.id,
      type: type as never,
      targetId,
      reason,
      content: extra || undefined,
    },
  });

  const sup = await prisma.group.findUnique({ where: { id: groupId }, select: { supervisorId: true } });
  if (sup?.supervisorId && sup.supervisorId !== user.id) {
    await notifyUser(sup.supervisorId, {
      type: 'SYSTEM',
      title: 'بلاغ جديد ⚠️',
      body: `بلاغ حول ${TARGETS[type].label}: ${reason}`,
    });
  }

  return ok();
}