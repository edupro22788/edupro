import { prisma } from './prisma';
import { notifyGroup } from './notifications';
import type { ApiUser } from './api-helpers';

// 3 أيام بدون تسجيل دخول → يتم سحب الإشراف تلقائيًا
const ABSENT_MS = 3 * 24 * 60 * 60 * 1000;

/** يسند إشراف الفوج لعضو معيّن ويغلق أي إشراف سابق */
export async function assignSupervisor(groupId: string, userId: string, electedBy: string) {
  await prisma.$transaction([
    prisma.groupSupervisor.updateMany({ where: { groupId, endedAt: null }, data: { endedAt: new Date() } }),
    prisma.groupSupervisor.create({ data: { groupId, userId, electedBy } }),
    prisma.group.update({ where: { id: groupId }, data: { supervisorId: userId } }),
  ]);
}

/**
 * فحص فترة غياب المشرف: إذا لم يسجّل دخولًا منذ أكثر من 3 أيام
 * يُسحب منه الإشراف ويُختار تلقائيًا العضو الأكثر نشاطًا (أعلى عدد تسجيل دخول).
 * إن لم يوجد أحد نشط، يبقى الفوج بدون مشرف ويفعّل عرض الشات.
 */
export async function ensureSupervisorFreshness(groupId: string): Promise<void> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      supervisor: true,
      memberships: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, loginCount: true, lastLoginAt: true } },
        },
      },
    },
  });
  if (!group?.supervisorId || !group.supervisor) return;

  const sup = group.supervisor;
  const lastActive = sup.lastLoginAt ?? sup.createdAt;
  if (lastActive.getTime() > Date.now() - ABSENT_MS) return;

  const oldSupervisorId = group.supervisorId;

  await prisma.$transaction([
    prisma.groupSupervisor.updateMany({ where: { groupId, endedAt: null }, data: { endedAt: new Date() } }),
    prisma.group.update({ where: { id: groupId }, data: { supervisorId: null } }),
  ]);

  const candidates = group.memberships
    .filter((m) => m.userId !== oldSupervisorId)
    .map((m) => m.user)
    .sort((a, b) => {
      if (a.loginCount !== b.loginCount) return b.loginCount - a.loginCount;
      return (a.lastLoginAt?.getTime() ?? 0) - (b.lastLoginAt?.getTime() ?? 0);
    });

  const best = candidates.find((u) => u.loginCount > 0);
  if (!best) return;

  await assignSupervisor(groupId, best.id, 'auto');
  await notifyGroup({
    groupId,
    type: 'SUPERVISOR_ELECTED',
    title: 'تغيير مشرف الفوج',
    body: `غاب المشرف أكثر من 3 أيام، أصبح ${best.firstName} ${best.lastName} مشرف الفوج.`,
    link: '/room',
  });
}

/** العضو التالي المؤهل لعرض المشرف (الأقدم انضمامًا ولم يرفض بعد) */
export async function getNextOfferMember(groupId: string) {
  return prisma.membership.findFirst({
    where: { groupId, offerDeclined: false },
    orderBy: { joinedAt: 'asc' },
    select: { userId: true },
  });
}

export type SupervisorOfferCtx = {
  amSupervisor: boolean;
  supervisor: { id: string; firstName: string; lastName: string } | null;
  offer: boolean;
};

/** حالة الإشراف داخل الدردشة: من المشرف الحالي، وهل يُعرض على هذا العضو تولّي الإشراف */
export async function getSupervisorOfferCtx(user: ApiUser): Promise<SupervisorOfferCtx> {
  const groupId = user.membership!.groupId;
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { supervisorId: true, supervisor: { select: { id: true, firstName: true, lastName: true } } },
  });
  const amSupervisor = group?.supervisorId === user.id;
  let offer = false;
  if (group && !group.supervisorId && !amSupervisor) {
    const next = await getNextOfferMember(groupId);
    offer = next?.userId === user.id;
  }
  return { amSupervisor, supervisor: group?.supervisor ?? null, offer };
}