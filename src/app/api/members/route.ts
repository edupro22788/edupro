import { requireApiGroupMember, ok, ApiGuardError } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  let user = await requireApiGroupMember().catch((e: unknown) => e as ApiGuardError);
  if (user instanceof ApiGuardError) return user.response;
  const groupId = user.membership!.groupId;

  const [group, memberships] = await Promise.all([
    prisma.group.findUnique({
      where: { id: groupId },
      select: { supervisorId: true, supervisor: { select: { id: true, firstName: true, lastName: true } } },
    }),
    prisma.membership.findMany({
      where: { groupId },
      orderBy: { joinedAt: 'asc' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, gender: true, loginCount: true, lastLoginAt: true },
        },
      },
    }),
  ]);

  return ok({
    supervisor: group?.supervisor ?? null,
    isSupervisor: group?.supervisorId === user.id,
    members: memberships.map((m) => ({
      id: m.user.id,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      gender: m.user.gender,
      joinedAt: m.joinedAt,
      loginCount: m.user.loginCount,
      lastLoginAt: m.user.lastLoginAt,
      chatBannedAt: m.chatBannedAt,
      me: m.user.id === user.id,
    })),
  });
}