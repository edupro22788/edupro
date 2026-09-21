import { NextRequest } from 'next/server';
import { ok, apiError } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const levelId = req.nextUrl.searchParams.get('levelId');
  if (!levelId) return apiError('مطلوب معرّف المستوى');

  const groups = await prisma.group.findMany({
    where: { studyLevelId: levelId },
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { memberships: true } } },
  });
  return ok({
    groups: groups.map((g) => ({
      id: g.id,
      name: g.name,
      members: g._count.memberships,
    })),
  });
}