import { NextRequest } from 'next/server';
import { requireApiGroupMember, ok, apiError, ApiGuardError } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { notifyGroup } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  let user = await requireApiGroupMember().catch((e: unknown) => e as ApiGuardError);
  if (user instanceof ApiGuardError) return user.response;

  if (user.membership!.group.supervisorId === user.id) {
    return apiError('أنت المشرف الحالي', 403);
  }

  const body = await req.json().catch(() => ({}));
  const statement = String(body?.statement || '').trim().slice(0, 500);

  const election = await prisma.election.findFirst({
    where: { groupId: user.membership!.groupId, status: 'OPEN' },
  });
  if (!election) return apiError('لا توجد انتخابات مفتوحة حاليًا');

  const already = await prisma.candidate.findUnique({
    where: { electionId_userId: { electionId: election.id, userId: user.id } },
  });
  if (already) return apiError('لقد ترشحت مسبقًا');

  await prisma.candidate.create({
    data: { electionId: election.id, userId: user.id, statement: statement || null },
  });

await notifyGroup({
      groupId: user.membership!.groupId,
      type: 'SUPERVISOR_ELECTED',
      title: 'ترشّح جديد 🗳️',
      body: `ترشّح ${user.firstName} ${user.lastName} لمشرف الفوج`,
      link: '/room/chat',
      excludeUserId: user.id,
    });

  return ok();
}