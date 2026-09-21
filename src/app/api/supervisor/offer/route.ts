import { NextRequest } from 'next/server';
import { requireApiGroupMember, ok, apiError, ApiGuardError } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { getNextOfferMember, assignSupervisor } from '@/lib/supervisor';
import { notifyGroup } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  let user = await requireApiGroupMember().catch((e: unknown) => e as ApiGuardError);
  if (user instanceof ApiGuardError) return user.response;

  const groupId = user.membership!.groupId;
  const body = await req.json().catch(() => ({}));
  const action = body?.action;
  if (action !== 'accept' && action !== 'decline') return apiError('إجراء غير صالح');

  const next = await getNextOfferMember(groupId);
  if (next?.userId !== user.id) return apiError('عرض الإشراف غير متاح لك الآن', 409);

  if (action === 'decline') {
    await prisma.membership.update({
      where: { userId: user.id },
      data: { offerDeclined: true, offerDeclinedAt: new Date() },
    });
    return ok();
  }

  // استبعاد التزامن: مشرف واحد فقط يفوز بالعرض
  const claimed = await prisma.group.updateMany({
    where: { id: groupId, supervisorId: null },
    data: { supervisorId: user.id },
  });
  if (claimed.count === 0) return apiError('فوجك لديه مشرف بالفعل', 409);

  await assignSupervisor(groupId, user.id, 'chat');
  await notifyGroup({
    groupId,
    type: 'SUPERVISOR_ELECTED',
    title: 'مشرف جديد 🎉',
    body: `قبل ${user.firstName} ${user.lastName} إشراف الفوج.`,
    link: '/room',
  });

  return ok({});
}