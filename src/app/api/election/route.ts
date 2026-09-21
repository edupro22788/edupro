import { requireApiGroupMember, ok, ApiGuardError } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  let user = await requireApiGroupMember().catch((e: unknown) => e as ApiGuardError);
  if (user instanceof ApiGuardError) return user.response;

  const groupId = user.membership!.groupId;
  const election = await prisma.election.findFirst({
    where: { groupId, status: 'OPEN' },
    orderBy: { createdAt: 'desc' },
    include: {
      candidates: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, gender: true } },
          _count: { select: { votes: true } },
        },
      },
      votes: true,
    },
  });

  return ok({
    election: election
      ? {
          id: election.id,
          startsAt: election.startsAt,
          endsAt: election.endsAt,
          candidates: election.candidates.map((c) => ({
            id: c.id,
            userId: c.userId,
            statement: c.statement,
            name: `${c.user.firstName} ${c.user.lastName}`,
            gender: c.user.gender,
            votes: c._count.votes,
          })),
        }
      : null,
    myVote: (election?.votes ?? []).find((v) => v.voterId === user.id)?.candidateId ?? null,
    isSupervisor: user.membership!.group.supervisorId === user.id,
  });
}