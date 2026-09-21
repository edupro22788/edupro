import { NextRequest } from 'next/server';
import { requireApiGroupMember, ok, apiError, ApiGuardError } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  let user = await requireApiGroupMember().catch((e: unknown) => e as ApiGuardError);
  if (user instanceof ApiGuardError) return user.response;

  const q = req.nextUrl.searchParams.get('q')?.trim() || '';
  if (q.length < 2) return ok({ q, results: [] });

  const groupId = user.membership!.groupId;
  const contains = (s: string) => ({ contains: s as string } as const);

  const [files, assignments, announcements, messages, members, subjects] = await Promise.all([
    prisma.studyFile.findMany({
      where: { groupId, status: 'PUBLISHED', title: contains(q) },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { id: true, title: true, category: true, createdAt: true },
    }),
    prisma.assignment.findMany({
      where: { groupId, status: 'PUBLISHED', title: contains(q) },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { id: true, title: true, createdAt: true },
    }),
    prisma.announcement.findMany({
      where: { groupId, status: { not: 'DELETED' }, title: contains(q) },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { id: true, title: true, createdAt: true },
    }),
    prisma.chatMessage.findMany({
      where: { groupId, status: 'ACTIVE', content: contains(q) },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { id: true, content: true, createdAt: true },
    }),
    prisma.membership.findMany({
      where: {
        groupId,
        user: { OR: [{ firstName: contains(q) }, { lastName: contains(q) }] },
      },
      take: 30,
      select: { user: { select: { id: true, firstName: true, lastName: true, gender: true } } },
    }),
    prisma.subject.findMany({
      where: { groupId, name: contains(q) },
      take: 30,
      select: { id: true, name: true },
    }),
  ]);

  return ok({
    q,
    results: {
      files,
      assignments,
      announcements,
      messages,
      members: members.map((m) => ({ id: m.user.id, name: `${m.user.firstName} ${m.user.lastName}`, gender: m.user.gender })),
      subjects,
    },
  });
}