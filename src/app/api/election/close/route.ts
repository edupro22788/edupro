import { requireApiGroupMember, ok, apiError, ApiGuardError } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { notifyGroup, notifyUser } from '@/lib/notifications';

export async function POST() {
  let user = await requireApiGroupMember().catch((e: unknown) => e as ApiGuardError);
  if (user instanceof ApiGuardError) return user.response;

  if (user.membership!.group.supervisorId !== user.id) {
    return apiError('فقط المشرف الحالي يمكنه إغلاق الانتخابات', 403);
  }

  const election = await prisma.election.findFirst({
    where: { groupId: user.membership!.groupId, status: 'OPEN' },
    include: {
      candidates: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { votes: true } },
        },
      },
    },
  });
  if (!election) return apiError('لا توجد انتخابات مفتوحة');

  const winner = election.candidates.sort((a, b) => b._count.votes - a._count.votes)[0];
  const group = await prisma.group.findUnique({ where: { id: election.groupId } });

  const winnerId = winner ? winner.userId : group?.supervisorId ?? null;

  await prisma.$transaction([
    prisma.election.update({
      where: { id: election.id },
      data: { status: 'COMPLETED', endsAt: new Date(), winnerId: winnerId ?? undefined },
    }),
    ...(winner && winner.userId !== group?.supervisorId
      ? [
          prisma.group.update({ where: { id: election.groupId }, data: { supervisorId: winner.userId } }),
          prisma.groupSupervisor.updateMany({
            where: { groupId: election.groupId, endedAt: null, userId: { not: winner.userId } },
            data: { endedAt: new Date() },
          }),
          prisma.groupSupervisor.create({
            data: { groupId: election.groupId, userId: winner.userId, electedBy: 'vote' },
          }),
        ]
      : []),
  ]);

  if (winner) {
    await notifyUser(winner.userId, {
      type: 'SUPERVISOR_ELECTED',
      title: 'تهانينا! أنت مشرف الفوج 🎉',
      body: 'كسبت انتخابات المشرف. ساعد أصدقاءك في فوجك الآن.',
      link: '/room',
    });
    await notifyGroup({
      groupId: election.groupId,
      type: 'SUPERVISOR_ELECTED',
      title: 'مشرف فوج جديد 🏅',
      body: `انتُخب ${winner.user.firstName} ${winner.user.lastName} مشرفًا لهذا الفوج`,
      link: '/room',
    });
  }

  return ok();
}