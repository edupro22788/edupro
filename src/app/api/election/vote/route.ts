import { NextRequest } from 'next/server';
import { requireApiGroupMember, ok, apiError, ApiGuardError } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  let user = await requireApiGroupMember().catch((e: unknown) => e as ApiGuardError);
  if (user instanceof ApiGuardError) return user.response;

  const body = await req.json().catch(() => ({}));
  const candidateId = String(body?.candidateId || '');

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: { election: true },
  });
  if (!candidate || candidate.election.groupId !== user.membership!.groupId) {
    return apiError('المرشح غير موجود', 404);
  }
  if (candidate.election.status !== 'OPEN') return apiError('الانتخابات غير مفتوحة');
  if (candidate.userId === user.id) return apiError('لا يمكنك التصويت لنفسك');

  const existing = await prisma.vote.findUnique({
    where: { electionId_voterId: { electionId: candidate.electionId, voterId: user.id } },
  });
  if (existing) {
    await prisma.vote.update({
      where: { id: existing.id },
      data: { candidateId },
    });
    return ok({ changed: true });
  }

  await prisma.vote.create({
    data: { electionId: candidate.electionId, candidateId, voterId: user.id },
  });
  return ok({ changed: false });
}